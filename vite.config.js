
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




/**
 * @type {import("vite").UserConfig}
 */
const config = {
    build:{
        lib: {
            name:pkgName, 
            entry: entry,
            formats:formats,
        },
        outDir:outDir,
        rollupOptions:{
            external:getDependencieNames(pkg),
        }
    }
};


/**
 * 导出最终的配置
 */
export default defineConfig((options)=>{
    const {mode} = options;

    switch (mode) {
        case "stage":{
            config.build.rollupOptions.external = getDependencieNames(pkg,["peerDependencies"]);
            break;
        }
        case "iife":{
            config.build.emptyOutDir = false;
            config.build.lib.formats = ["iife"];
            config.build.rollupOptions.external = getDependencieNames(pkg,["peerDependencies"]);
            break;
        }
    }

    return config;
})