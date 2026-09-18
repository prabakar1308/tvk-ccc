const fs = require('fs');

const path = 'e:/TVK/IT/Code Base/TVK Command Centre/frontend/src/app/[locale]/(dashboard)/cadres/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for CadreFormDialog
content = content.replace(
  "import { cn } from \"@/lib/utils\";\n",
  "import { cn } from \"@/lib/utils\";\nimport { CadreFormDialog } from '@/components/cadre-form-dialog';\n"
);

// 2. Remove state and forms
const statePattern = /const initialFormData: CreateCadreDto = \{[\s\S]*?const \[boothOpen, setBoothOpen\] = useState\(false\);/g;
content = content.replace(statePattern, "");

// 3. Update handleOpenCreate and handleOpenEdit
const handleOpenCreatePattern = /const handleOpenCreate = \(\) => \{[\s\S]*?setIsModalOpen\(true\);\n  \};/g;
content = content.replace(handleOpenCreatePattern, `const handleOpenCreate = () => {\n    setEditingId(null);\n    setIsModalOpen(true);\n  };`);

const handleOpenEditPattern = /const handleOpenEdit = \(cadre: any\) => \{[\s\S]*?setIsModalOpen\(true\);\n  \};/g;
content = content.replace(handleOpenEditPattern, `const handleOpenEdit = (cadre: any) => {\n    setEditingId(cadre.id);\n    setIsModalOpen(true);\n  };`);

// 4. Remove handleSubmit
const handleSubmitPattern = /const handleSubmit = async \(e: React.FormEvent\) => \{[\s\S]*?setIsUploading\(false\);\n    \}\n  \};/g;
content = content.replace(handleSubmitPattern, "");

// 5. Replace Dialog block
const dialogPattern = /<Dialog open=\{isModalOpen\} onOpenChange=\{setIsModalOpen\}>[\s\S]*?<\/Dialog>/g;
content = content.replace(dialogPattern, `<Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">\n            <Plus className="mr-2 h-5 w-5" /> Register Cadre\n          </Button>`);

// 6. Inject <CadreFormDialog /> at the end of the return statement before the closing div
content = content.replace(
  /(\s*)<\/div>\n\s*\{?\/\* Import Modal \*\/\}?/g,
  `\n      <CadreFormDialog \n        isOpen={isModalOpen}\n        onOpenChange={setIsModalOpen}\n        editingId={editingId}\n        cadres={cadres}\n      />\n$1</div>\n      {/* Import Modal */}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated cadres/page.tsx');
