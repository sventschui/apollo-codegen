"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_1 = require("@babel/generator");
const common_tags_1 = require("common-tags");
class Printer {
    constructor() {
        this.printQueue = [];
    }
    print() {
        return this.printQueue
            .reduce((document, printable) => {
            if (typeof printable === 'string') {
                return document + printable;
            }
            else {
                const documentPart = generator_1.default(printable).code;
                return document + this.fixCommas(documentPart);
            }
        }, '');
    }
    enqueue(printable) {
        this.printQueue = [
            ...this.printQueue,
            '\n',
            '\n',
            printable
        ];
    }
    printAndClear() {
        const output = this.print();
        this.printQueue = [];
        return output;
    }
    fixCommas(documentPart) {
        const lines = documentPart
            .split('\n')
            .filter(Boolean);
        let currentLine = 0;
        let nextLine;
        const newDocumentParts = [];
        let maxCommentColumn = 0;
        while (currentLine !== lines.length) {
            nextLine = currentLine + 1;
            const strippedNextLine = common_tags_1.stripIndent `${lines[nextLine]}`;
            if (strippedNextLine.length === 1 && strippedNextLine[0] === ',') {
                const currentLineContents = lines[currentLine];
                const commentColumn = currentLineContents.indexOf('//');
                if (maxCommentColumn < commentColumn) {
                    maxCommentColumn = commentColumn;
                }
                const [contents, comment] = currentLineContents.split('//');
                newDocumentParts.push({
                    main: contents.replace(/\s+$/g, '') + ',',
                    comment: comment ? comment.trim() : null
                });
                currentLine++;
            }
            else {
                newDocumentParts.push({
                    main: lines[currentLine],
                    comment: null
                });
            }
            currentLine++;
        }
        return newDocumentParts.reduce((memo, part) => {
            const { main, comment } = part;
            let line;
            if (comment !== null) {
                const spacesBetween = maxCommentColumn - main.length;
                line = `${main}${' '.repeat(spacesBetween)} // ${comment}`;
            }
            else {
                line = main;
            }
            return [
                ...memo,
                line
            ];
        }, []).join('\n');
    }
}
exports.default = Printer;
//# sourceMappingURL=printer.js.map