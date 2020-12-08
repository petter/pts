import transform from "..";
import { ASTNode } from "../../AST";
import Scope from "./Scope";

export type ScopedAST = ASTNode & {scope: Scope};
export default function toScopedAST(program: ASTNode) : ScopedAST {
    const rootScope = new Scope(undefined);
    function setScope<Inp extends {children: Inp[]}>(node : Inp, scope : Scope) : Inp & {scope: Scope} {
        return {
            ...node,
            children: node.children.map(c => setScope(c, scope)),
            scope
        };
    }

    const rootScopedAst = setScope(program, rootScope);

    return transform<ScopedAST, ScopedAST>(rootScopedAst, (revisit) => {

        const makeScope = (node: ScopedAST, _ : ScopedAST[])  => {
            const scope = new Scope(node.scope);
            const scopedChildren = revisit(node.children.map(child => setScope(child, scope))) as ScopedAST[];
            return {
                ...node,
                children: scopedChildren, 
                scope,
            }
        }
        return {

        class_body: makeScope,

        statement_block: makeScope,
        enum_body: makeScope, 
        if_statement: makeScope,
        else_statement: makeScope,
        for_statement: makeScope,
        for_in_statement: makeScope,
        while_statement: makeScope,
        do_statement: makeScope,
        try_statement: makeScope,
        with_statement: makeScope,
        default: (node, children) => ({
            ...node,
            children,
        })
        }
    }) as ScopedAST;
}
