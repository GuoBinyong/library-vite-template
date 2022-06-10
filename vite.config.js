
import { defineConfig } from 'vite'
import {getDependencieNames,getBaseNameOfHumpFormat} from "package-tls";
import pkg from "./package.json" assert {type: "json"};
import {dirname} from "path";
import {build} from "vite";
import {generate_d_ts} from "build-tls";
import {builtinModules} from "node:module"


// 手动配置
const entry = 'src/index.ts';   // 输入（入口）文件
//所需构建的模块格式
const formats_ExcludeDep = ['es', 'umd'];  //要排除依赖包的模块格式
const formats_IncludeDep = ['iife'];  //要包含依赖包的模块格式
const copyDTS = true;  //是否要拷贝项目中已存在的类型声明文件.d.ts 到输出目录中


// 自动配置
const pkgName = getBaseNameOfHumpFormat(pkg.name);  //驼峰格式的 pkg.name
const outDir = pkg.main ? dirname(pkg.main) : "dist";    //输出目录
let declarationDir =  pkg.types || pkg.typings;  //类型声明文件的输出目录
declarationDir = declarationDir ?  dirname(declarationDir) : outDir;

const nodeBuiltinModules = [/^node:/,...builtinModules];   //node 的内置模块，一般需要排除；
const excludedDep_Exclude = [...nodeBuiltinModules,...getDependencieNames(pkg)];   // 排除依赖包模块格式所需要排除的依赖
const excludedDep_Include = [...nodeBuiltinModules,...getDependencieNames(pkg,["peerDependencies"])];   // 包含依赖包模块格式所需要排除的依赖




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
export default defineConfig((options)=>{
    const {mode,command} = options;
    if (command !== "build") return config;


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

    generate_d_ts(dirname(entry),declarationDir,{
        copyDTS:copyDTS,
    });
    return config;
})