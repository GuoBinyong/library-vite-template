
import { defineConfig } from 'vite'
import {getDependencieNames,getBaseNameOfHumpFormat} from "package-tls";
import pkg from "./package.json" assert {type: "json"};
import {dirname,relative,parse} from "node:path";
import {build} from "vite";
import {generate_d_ts} from "build-tls";
import {builtinModules} from "node:module"


// 手动配置
const entry = 'src/index.ts';   // 输入（入口）文件
//所需构建的模块格式
const formats_ExcludeDep = ['es', 'umd'];  //要排除依赖包的模块格式
const formats_IncludeDep = ['iife'];  //要包含依赖包的模块格式
/**
 * 是否要拷贝项目中已存在的类型声明文件.d.ts 到输出目录中
 * 可通过指定为 false 来禁止拷贝
 */
const copyDTS = {
    exclude:["vite-env.d.ts"], //需要排除的文件或目录
};






// 自动配置
const pkgName = getBaseNameOfHumpFormat(pkg.name);  //驼峰格式的 pkg.name
const srcDir = dirname(entry);   //源代码根目录
const outDir = pkg.main ? dirname(pkg.main) : "dist";    //输出目录
let declarationDir =  pkg.types || pkg.typings;  //类型声明文件的输出目录
declarationDir = declarationDir ?  dirname(declarationDir) : outDir;

const nodeBuiltinModules = [/^node:/,...builtinModules];   //node 的内置模块，一般需要排除；
const excludedDep_Exclude = [...nodeBuiltinModules,...getDependencieNames(pkg)];   // 排除依赖包模块格式所需要排除的依赖
const excludedDep_Include = [...nodeBuiltinModules,...getDependencieNames(pkg,["peerDependencies"])];   // 包含依赖包模块格式所需要排除的依赖



// 需要单独构建的 Worker 文件的配置选项
const workerFileBuildOptions = {
    entrys:[],  // worker 的入口文件
    outDir:srcDir, // worker 的输出目录
    fileName:"[dir]/[name]", // 构建产物的文件名字，详见 buildFiles() 函数的 fileName 选项
    formats:["es"],  // 构建产物的模块格式
};



/**
 * @type {import("vite").UserConfig}
 */
const config = {
    build:{
        lib: {
            name:pkgName, 
            entry: entry,
        },
        outDir:outDir,
        rollupOptions:{
            external:excludedDep_Exclude,
        }
    }
};






/**
 * 导出最终的配置
 */
export default defineConfig(async (options)=>{
    const {mode,command} = options;
    if (command !== "build") return config;
    if (workerFileBuildOptions.entrys.length)
    await buildFiles(workerFileBuildOptions);

    switch (mode) {
        case "stage":{
            config.build.lib.formats = [...formats_ExcludeDep,...formats_IncludeDep];
            config.build.rollupOptions.external = excludedDep_Include;
            break;
        }
        default: {
            if (formats_IncludeDep.length>0){
                const inlineConfig = JSON.parse(JSON.stringify(config));
                inlineConfig.configFile = false; // 防止死循环：循环调用此函数
                inlineConfig.build.emptyOutDir = false; // 不清空输出目录
                inlineConfig.build.lib.formats = formats_IncludeDep;
                inlineConfig.build.rollupOptions.external = excludedDep_Include;
                build(inlineConfig); //单独进行构建
            }
        }
    }

    generate_d_ts(srcDir,declarationDir,{
        copyDTS:copyDTS,
    });
    return config;
});






// ---------------- 工具 --------------------

/**
 * 构建文件
 * @param {{entrys:string[],outDir?:string,fileName?:string,formats?:string[]}} options 
 *    entrys:string[] - 入口文件列表，每个文件都会单独构建
 *    outDir?:string  - 构建的输出目录
 *    fileName?:string - 构建产物的文件名字（可以指定路径），
 *          [dir] 表示入口文件的路径；
 *          [format]：输出选项中定义的渲染格式。
 *          [name]：文件的文件名（不带扩展名）。
 *          [ext]: 文件的扩展名。
 *          [extname]：文件的扩展名，.如果它不为空，则为前缀。
 *          [assetExtname]: 文件的扩展名，.如果它不为空且不是 、 或 之一，则为js前缀。jsxtstsx
 *      formats?:string[] - 构建产物的模块格式
 * @returns 构建完成的 Promise
 * 
 * 
 */
 function buildFiles(options){
     const {entrys,outDir,formats} = options;
     if (!entrys?.length) return;
     
     let {fileName} = options;
     fileName = fileName || "[dir]/[name]";

    const buildProArr = entrys.map((entryFile)=>{
        const  relPath = relative(srcDir,entryFile);
        const fileInfo = parse(relPath);
        fileName = fileName.replaceAll("[dir]",fileInfo.dir);
        
        return  build({
            configFile:false,
            build:{
                emptyOutDir:false,
                lib: {
                    name:fileInfo.name,
                    formats:formats,
                    entry: entryFile,
                    fileName:fileName,
                },
                outDir:outDir,
            }
        });
    });
    
    return Promise.all(buildProArr);
}
