class ObjectReader {
    constructor(canvas) {
        this.canvas = canvas;
    }

    readMtlFile(file) {
        const mtlFileName = file.substring(0, file.lastIndexOf(".")) + ".mtl"
        const fileContent = this.#loadFileContent(mtlFileName);
        return this.#parseMtlFile(fileContent);
    }

    readObjFile(file) {
        let fileContent = this.#loadFileContent(file);
        return this.#parseObjFile(fileContent);
    }


    #loadFileContent(file) {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", file, false);
        xmlHttp.send();
        return xmlHttp.responseText;
    }

    #parseObjFile(fileContent) {
        let vert = []
        let face = []
        let line;
        let v = 0;
        let f = 0;
        let m = 0;
        let max = 0;
        let j;
        let dist;
        let fac;
        let mat = "null";
        fileContent = fileContent + "\n";
        while (fileContent.indexOf("\n") !== -1) {
            line = fileContent.substring(0, fileContent.indexOf("\n"));
            if (line.substring(0, 2) === "v ") {
                vert[v] = new Array(3);
                line = line.substring(2);
                vert[v][0] = line.substring(0, line.indexOf(" "));
                line = line.substring(line.indexOf(" ") + 1);
                vert[v][1] = line.substring(0, line.indexOf(" "));
                line = line.substring(line.indexOf(" ") + 1);
                vert[v][2] = line;

                dist = Math.sqrt(vert[v][0] * vert[v][0] + vert[v][1] * vert[v][1] + vert[v][2] * vert[v][2]);
                if (dist > max) {
                    max = dist;
                }
                v = v + 1;
            } else if (line.substring(0, 2) === "f ") {
                line = line.substring(2);
                face[f] = [];
                j = 0;
                while (line.indexOf(" ") !== -1) {
                    face[f][j] = line.substring(0, line.indexOf(" "));
                    if (face[f][j].indexOf('/') !== -1) {
                        face[f][j] = face[f][j].substring(0, face[f][j].indexOf('/'));
                    }
                    face[f][j] = face[f][j] - 1;
                    line = line.substring(line.indexOf(" ") + 1);
                    j = j + 1;
                }
                face[f][j] = line;
                if (face[f][j].indexOf('/') !== -1) {
                    face[f][j] = face[f][j].substring(0, face[f][j].indexOf('/'));
                }
                face[f][j] = face[f][j] - 1;
                face[f][j + 1] = mat;
                f = f + 1;
            } else if (line.substring(0, 6) === "usemtl") {
                mat = line.substring(7);
            }
            fileContent = fileContent.substring(fileContent.indexOf("\n") + 1);
        }
        return {
            max: max,
            vert: vert,
            face: face
        }
    }

    #parseMtlFile(fileContent) {
        const material = [];
        fileContent = fileContent + "\n";
        let i = -1;
        let line;
        let totalMaterial = 0;
        let hasMtl = true;
        while (fileContent.indexOf("\n") !== -1){
            line = fileContent.substring(0, fileContent.indexOf("\n"));
            if (line.substring(0, 6) === "newmtl"){
                i = i + 1;
                material[i] = new Array(4);
                material[i][0] = line.substring(line.indexOf(" ") + 1);
            }
                //Kd, ddifuse color, usefull
                //Ka, ambient color, not implemented
                //Ks, specular color, not implemented
            //d or TR, transparency, not now
            else if (line.substring(0, 3) === "Kd "){
                line = line.substring(3);
                material[i][1] = line.substring(0, line.indexOf(" "));
                line = line.substring(line.indexOf(" ") + 1);
                material[i][2] = line.substring(0, line.indexOf(" "));
                line = line.substring(line.indexOf(" ") + 1);
                material[i][3] = line;
            }
            fileContent = fileContent.substring(fileContent.indexOf("\n") + 1);
        }
        totalMaterial = material.length;
        if (totalMaterial === 0){
            hasMtl = false;
        }
        return {
            hasMtl: hasMtl,
            material: material
        }
    }

}

