
import { defineConfig } from 'vite'
import {getDependencieNames,getBaseNameOfHumpFormat,removeScope} from "package-tls";
import pkg from "./package.json";
import {dirname} from "path"


// 手动配置
const entry = 'src/index.ts';   // 输入（入口）文件
const formats = ['es', 'umd'];  //所需构建的模块格式

// 自动配置
const pkgName = getBaseNameOfHumpFormat(pkg.name);  //驼峰格式的 pkg.name
const outDir = dirname(pkg.main || "dist");    //输出目录
// const extensions = ['.tsx', '.ts','.jsx','.mjs', '.js', '.json','.node'];  // 默认查找的文件扩展名




/**
 * @type {import("vite").UserConfig}
 */
const config = {
    build:{
        lib: {
            name:pkgName, 
            entry: entry,
            formats:formats,
            // fileName:removeScope(pkg.name)
        },
        outDir:outDir,
        rollupOptions:{
            external:getDependencieNames(pkg),
        }
    }
};


export default defineConfig((options)=>{
    console.log("---",options);
    const {mode} = options;
    /**
     * 必须要包含的包
     */
    let include = [];
    switch (mode) {
        case 'stage':{
            include =  ["@turf/turf"];
            break;
        }
    }

    // config.build.rollupOptions.external = externalPkgs.filter((item)=> !include.includes(item) );

    return config;
})