
import { defineConfig } from 'vite'
import {getDependencieNames,getBaseNameOfHumpFormat,removeScope} from "package-tls";
import pkg from "./package.json";

/**
 * 要被排除的包
 */
const externalPkgs = [...getDependencieNames(pkg),"cesium/Build/Cesium/Widgets/widgets.css"];


/**
 * @type {import("vite").UserConfig}
 */
const config = {
    build:{
        lib: {
            name:getBaseNameOfHumpFormat(pkg.name), 
            entry: "src/gis",
            formats:["es"],
            // fileName:removeScope(pkg.name)
        },
        rollupOptions:{
            external:externalPkgs,
        }
    }
};


export default defineConfig((options)=>{
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

    config.build.rollupOptions.external = externalPkgs.filter((item)=> !include.includes(item) );

    return config;
})