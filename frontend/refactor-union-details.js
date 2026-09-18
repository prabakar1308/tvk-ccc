const fs = require('fs');

const path = 'e:/TVK/IT/Code Base/TVK Command Centre/frontend/src/app/[locale]/(dashboard)/unions/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import { Link } from '@/i18n/routing';",
  "import { Link } from '@/i18n/routing';\nimport { useState } from 'react';\nimport { CadreFormDialog } from '@/components/cadre-form-dialog';\nimport { Button } from '@/components/ui/button';\nimport { Plus } from 'lucide-react';\nimport { useQueryClient } from '@tanstack/react-query';"
);

// 2. Add state inside the component
content = content.replace(
  "const { data: union, isLoading } = useUnion(id as string);",
  "const { data: union, isLoading } = useUnion(id as string);\n  const [isModalOpen, setIsModalOpen] = useState(false);\n  const queryClient = useQueryClient();"
);

// 3. Update the header JSX to include the button
const headerSearch = `<div className="flex items-center gap-4">
        <Link href="/unions" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">{union.name}</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {union.district?.name || 'Unknown'} District • {union.group === 'KURINJIPADI' ? 'Kurinjipadi' : union.group === 'CUDDALORE' ? 'Cuddalore' : union.group}
          </p>
        </div>
      </div>`;

const headerReplace = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/unions" className="p-2 bg-white rounded-full border shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900">{union.name}</h1>
            <p className="text-muted-foreground font-medium mt-1">
              {union.district?.name || 'Unknown'} District • {union.group === 'KURINJIPADI' ? 'Kurinjipadi' : union.group === 'CUDDALORE' ? 'Cuddalore' : union.group}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-md h-11 px-6 rounded-lg transition-transform active:scale-95">
          <Plus className="mr-2 h-5 w-5" /> Register Cadre
        </Button>
      </div>`;

content = content.replace(headerSearch, headerReplace);

// 4. Inject CadreFormDialog at the bottom
content = content.replace(
  "    </div>\n  );\n}",
  `      <CadreFormDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultLevel="UNION"
        defaultUnionId={union.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['unions', id] });
        }}
      />
    </div>
  );
}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated unions/[id]/page.tsx');
