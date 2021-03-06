import { ASTNode } from '../../../AST';
import toOriginalAST from '../scope/toOriginalAST';
import ASTScoper from '../scope/ASTScoper';

type Renaming = { old: string; new: string };
type ClassRenaming = Renaming & { fields: Renaming[] };

export default function rename(renamings: ClassRenaming[], body: ASTNode[]): ASTNode[] {
    const root = {
        type: 'temp_root',
        children: body.flat(), // TODO: Find out why this sometimes is nested, and fix it
        text: '',
    };
    const scopedAST = ASTScoper.transform(root);
    renamings.forEach((classRenaming) => {
        scopedAST.scope.rename(classRenaming.old, classRenaming.new);
        classRenaming.fields.forEach((fieldRenaming) =>
            scopedAST.scope.renameField(classRenaming.old, fieldRenaming.old, fieldRenaming.new),
        );
    });
    return (toOriginalAST(scopedAST) as ASTNode).children;
}
