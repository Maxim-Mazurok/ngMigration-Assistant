/**
 * AnalysisTool scans an AngularJS app for certain critera to recommend
 * a particular migration path to Angular. It employs traversing files,
 * regular expressions, a decision tree algorithm, and final recommendations. 
 */

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as fs from 'fs';

export class AnalysisTool {

    analysisResults = {
        rootScope: false,
        angularElement: false,
        uiRouter: false,
        angularjsRouter: false,
        angularRouter: false,
        hasUnitTest: false,
        jsFileCount: 0,
        tsFileCount: 0,
        controllersCount: 0,
        componentDirectivesCount: 0
    };

    private CODE_LIMIT_MULTIPLIER: number = 1.5;
    private CODE_LIMIT_DOUBLE: number = 2;
    private VALUE_NOT_FOUND: number = -1;
    private maxCodeLimit: number; // 880 lines considered 1 month's work of coding 


    constructor(path: string) {
        this.maxCodeLimit = 880;
        console.log("\n********START********");
        setTimeout(() => { }, 100000);
        console.log("***Analysis Tests Section***");
        this.callAnalysisTests(path);
        this.decisionTree();
        console.log("********END********\n")
    }

    public recommendation() {
        console.log("\n***Recommendation Section***");
        let appLinesOfCode = 0;
        if (this.maxCodeLimit > appLinesOfCode) {

        }
    }

    private decisionTree() {
        console.log("\n***Decision Tree Outputs***");
        //rootScope
        if (this.analysisResults.rootScope) {
            this.maxCodeLimit *= this.CODE_LIMIT_MULTIPLIER;
        }
        //angular element
        //router
        //unit tests
        if (!this.analysisResults.hasUnitTest) {
            this.maxCodeLimit *= this.CODE_LIMIT_MULTIPLIER;
        }
        //scripting language
        if (this.analysisResults.jsFileCount > 0) {
            this.maxCodeLimit *= this.CODE_LIMIT_MULTIPLIER; //(this.jsFileCount / 10); 
            console.log("You still have " + this.analysisResults.jsFileCount + " JavaScript file left to convert to TypeScript.")
            console.log("You have converted " + this.analysisResults.tsFileCount + " files successfully to TypeScript.");
        }
        //component
        if (this.analysisResults.componentDirectivesCount > 0 && this.analysisResults.controllersCount == 0) {
            console.log("Prepared for ngUpgrade!")
        } else if (this.analysisResults.componentDirectivesCount > 0 && this.analysisResults.controllersCount > 0) {
            console.log("Still have " + this.analysisResults.controllersCount + " controller(s) to convert to component directive before upgrading with ngUpgrade");
            this.maxCodeLimit *= this.CODE_LIMIT_MULTIPLIER;
        } else if (this.analysisResults.controllersCount > 0) {
            console.log("Need to begin converting " + this.analysisResults.controllersCount + " controller(s) to have component directive before upgrading with ngUpgrade.");
            this.maxCodeLimit *= this.CODE_LIMIT_DOUBLE;
        }  
    }

    /**
     * Recursively traverses file system and scans each file by calling analysis tests.
     * Attaches current file to next file to produce correct directory and traverse down the tree. 
     * @param path 
     */
    callAnalysisTests(path: string) {
        console.log("------>Descending into " + path);
        const list = fs.readdirSync(path);

        let currentFilePath: string = "";
        let fileData: string = "";
        let tests = [
            (filename: string, data: string) => this.checkFileForRootScope(filename, data),
            (filename: string, data: string) => this.checkFileForAngularElement(filename, data),
            (filename: string, data: string) => this.checkFileForRouter(filename, data),
            (filename: string, data: string) => this.checkFileForUnitTests(filename, data),
            (filename: string, data: string) => this.checkFileForScriptingLanguage(filename, data),
            (filename: string, data: string) => this.checkFileForComponent(filename, data)
        ];

        for (let file of list) {
            console.log(file);
            currentFilePath = path + "/" + file;

            if (!fs.statSync(currentFilePath).isDirectory()) {
                this.checkFileForRootScope(currentFilePath, fs.readFileSync(currentFilePath, "utf8"));
                for (let test of tests) {
                    test(currentFilePath, fs.readFileSync(currentFilePath, "utf8"));
                }

            } else {
                path = currentFilePath;
                this.callAnalysisTests(path);
            }
        }
    }

    checkFileForRootScope(filename: string, fileData: string) {
        if (fileData.match(/\$rootScope/)) {
            console.log("--->Found Rootscope!");
            this.analysisResults.rootScope = true;
        }
    }

    checkFileForAngularElement(filename: string, fileData: string) {
        if (fileData.match(/NgElementConstructor/)) {
            console.log("--->Angular Element");
            this.analysisResults.angularElement = true;
        }
    }

    checkFileForRouter(filename: string, fileData: string) {
        if (fileData.match(/['"]ui\.router['"]/)) {
            console.log("--->Found UI router");
            this.analysisResults.uiRouter = true;
        } else if (fileData.match(/['"]ngRoute['"]/)) {
            console.log("--->Found AJS router");
            this.analysisResults.angularjsRouter = true;
        } else if (fileData.match(/['"]\@angular\/router['"]/)) {
            console.log("--->Found A router");
            this.analysisResults.angularRouter = true;
        }
    }

    checkFileForUnitTests(filename: string, fileData: string) {
        if (filename.substr(-7, 4) === 'spec') {
            console.log("--->Spec found: true!");
            this.analysisResults.hasUnitTest = true;
        }
    }

    checkFileForScriptingLanguage(filename: string, fileData: string) {
        if (filename.substr(-3) === '.js') {
            this.analysisResults.jsFileCount++;
        } else if (filename.substr(-3) === ".ts") {
            this.analysisResults.tsFileCount++;
        }
    }

    checkFileForComponent(filename: string, fileData: string) {
        if (fileData.match(/\.controller\(/)) {
            console.log("--->Found a controller in " + filename);
            this.analysisResults.controllersCount++;
        }

        if (fileData.match(/.component\(/)) {
            console.log("--->Found a component-directive in " + filename);
            this.analysisResults.componentDirectivesCount++;
        }
    }

    /**
     * Most likely will not include this function, though keeping it here for now.
     * checkAngularVersion()
     * check pacakage.json under key dependencies and see AJS version in angular and A in @angular/core
     * if use bower -> do this: bower.json which has dependencies key and angular
     * 
     * if(filename.substr(-12) === 'package.json' || filename.substr(-10) === 'bower.json') {
            console.log("--->Data: " + fileData);
            console.log("--->Dependencies: " + fileData.includes("angular"));
        }
     * */
}