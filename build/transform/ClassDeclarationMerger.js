"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const lodash_1 = __importDefault(require("lodash"));
const classDeclId = (classDecl) => classDecl.children.find(util_1.typeIs('type_identifier')).text;
class ClassDeclarationMerger {
    constructor(program) {
        this.applyToNodesOfType = (typeFuncMap) => {
            function applyToNodesOfTypeRecurse(node) {
                let newNode = node;
                if (node.type in typeFuncMap) {
                    newNode = typeFuncMap[node.type](node);
                }
                const newChildren = newNode.children.map(applyToNodesOfTypeRecurse);
                return { ...newNode, children: newChildren };
            }
            this.program = applyToNodesOfTypeRecurse(this.program);
        };
        this.mergeClasses = () => {
            this.applyToNodesOfType({
                package_template_body: this.mergeClassesInPTBody,
            });
            return this.program;
        };
        this.mergeClassesInPTBody = (node) => {
            const groupedClassDecls = this.groupClassDeclarations(node.children);
            this.verifyAddtoValid(groupedClassDecls);
            const hasMergedClass = {};
            const classesMergedBody = util_1.filterMap(node.children, (child) => {
                if (util_1.typeIs(['class_declaration', 'addto_statement'])(child)) {
                    const classId = classDeclId(child);
                    if (hasMergedClass[classId]) {
                        return null;
                    }
                    else {
                        hasMergedClass[classId] = true;
                        return this.produceClassDeclaration(groupedClassDecls[classId]);
                    }
                }
                else {
                    return child;
                }
            });
            return { ...node, children: classesMergedBody };
        };
        this.groupClassDeclarations = (nodes) => {
            const classDeclarations = nodes.filter(util_1.typeIs(['class_declaration', 'addto_statement']));
            return lodash_1.default.groupBy(classDeclarations, classDeclId);
        };
        this.verifyAddtoValid = (groups) => {
            Object.keys(groups).forEach((key) => this.verifyAddtoValidGroup(key, groups[key]));
        };
        this.verifyAddtoValidGroup = (className, group) => {
            if (group.every(util_1.typeIs('addto_statement')))
                throw new Error(`Can\'t addto class ${className} as there is no class declaration for ${className}`);
        };
        this.produceClassDeclaration = (classDecls) => {
            const classBody = this.produceClassDeclarationBody(classDecls);
            return this.produceClassDeclarationSignature(classDecls, classBody);
        };
        this.produceClassDeclarationBody = (classDecls) => {
            const classBodiesWithBrackets = classDecls.map((decl) => decl.children.find(util_1.typeIs('class_body'))?.children || []);
            const classBodiesWithoutBrackets = classBodiesWithBrackets.map((el) => el.slice(1, -1));
            const openingBracket = classBodiesWithBrackets[0][0];
            const closingBracket = classBodiesWithBrackets[0][classBodiesWithBrackets[0].length - 1];
            return [openingBracket, ...classBodiesWithoutBrackets.reduce(util_1.joinArrays), closingBracket];
        };
        this.produceClassDeclarationSignature = (classDecls, classBody) => {
            // TODO: Merge heritage
            const resNode = { ...classDecls.find(util_1.typeIs('class_declaration')) };
            return {
                ...resNode,
                children: resNode.children.map((el) => (el.type === 'class_body' ? { ...el, children: classBody } : el)),
            };
        };
        this.program = program;
    }
    static transform(program) {
        const classDeclarationMerger = new ClassDeclarationMerger(program);
        return classDeclarationMerger.mergeClasses();
    }
}
exports.default = ClassDeclarationMerger;
