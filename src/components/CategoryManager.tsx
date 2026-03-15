import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/categoryApi";
import type { Book } from "@/types/book";

function SortableCategoryItem({
  cat,
  editingId,
  editingName,
  setEditingName,
  onStartEdit,
  onUpdate,
  onCancelEdit,
  onDelete,
  bookCount,
}: {
  cat: Category;
  editingId: string | null;
  editingName: string;
  setEditingName: (v: string) => void;
  onStartEdit: (cat: Category) => void;
  onUpdate: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (cat: Category) => void;
  bookCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border bg-card p-2 gap-1.5"
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
        </button>
        {editingId === cat.id ? (
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate(cat.id);
              if (e.key === "Escape") onCancelEdit();
            }}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
          <span className="text-xs text-muted-foreground ml-1 shrink-0">{bookCount}</span>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {editingId === cat.id ? (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdate(cat.id)}>
              <Check className="h-3 w-3 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelEdit}>
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onStartEdit(cat)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(cat)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function CategoryManager({ books = [] }: { books?: Book[] }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      toast({ title: "카테고리 로딩 실패", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      toast({ title: "이미 존재하는 카테고리입니다", variant: "destructive" });
      return;
    }
    try {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
      await addCategory(name, maxOrder + 1);
      setNewName("");
      await load();
      toast({ title: `"${name}" 카테고리가 추가되었습니다` });
    } catch (err) {
      toast({ title: "추가 실패", description: String(err), variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name && c.id !== id)) {
      toast({ title: "이미 존재하는 카테고리입니다", variant: "destructive" });
      return;
    }
    try {
      await updateCategory(id, { name });
      setEditingId(null);
      await load();
      toast({ title: "카테고리가 수정되었습니다" });
    } catch (err) {
      toast({ title: "수정 실패", description: String(err), variant: "destructive" });
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?\n이 카테고리가 지정된 도서는 영향을 받지 않습니다.`)) return;
    try {
      await deleteCategory(cat.id);
      await load();
      toast({ title: `"${cat.name}" 카테고리가 삭제되었습니다` });
    } catch (err) {
      toast({ title: "삭제 실패", description: String(err), variant: "destructive" });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);

    // Optimistic update
    setCategories(reordered);

    // Persist new sort_order values
    try {
      await Promise.all(
        reordered.map((cat, i) => updateCategory(cat.id, { sort_order: i }))
      );
    } catch (err) {
      toast({ title: "순서 변경 실패", description: String(err), variant: "destructive" });
      await load();
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
        카테고리 관리
      </h2>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="새 카테고리 이름"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="max-w-xs"
        />
        <Button onClick={handleAdd} size="sm" disabled={!newName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          추가
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 카테고리가 없습니다.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <SortableCategoryItem
                  key={cat.id}
                  cat={cat}
                  editingId={editingId}
                  editingName={editingName}
                  setEditingName={setEditingName}
                  onStartEdit={startEdit}
                  onUpdate={handleUpdate}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={handleDelete}
                  bookCount={books.filter((b) => b.category === cat.name).length}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
