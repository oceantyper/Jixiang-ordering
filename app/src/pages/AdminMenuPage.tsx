import { useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/constants";
import { AdminLayout } from "@/components/AdminLayout";
import { DishImage } from "@/components/DishImage";
import { TagPill } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tag = { id: number; name: string; color: string };
type Dish = {
  id: number;
  name: string;
  nameRu: string | null;
  description: string | null;
  descriptionRu: string | null;
  price: string;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  tags: Tag[];
};

/** 读取文件并压缩到最长边 960px 的 JPEG data URL（限制 2MB） */
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      reject(new Error("仅支持 JPG/PNG/WebP/GIF 图片"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("图片不能超过 2MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 960 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

type DishForm = {
  id?: number;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  price: string;
  category: string;
  isAvailable: boolean;
  tagIds: number[];
  imageUrl: string | null;
};

const emptyForm: DishForm = {
  name: "",
  nameRu: "",
  description: "",
  descriptionRu: "",
  price: "",
  category: "中式热菜",
  isAvailable: true,
  tagIds: [],
  imageUrl: null,
};

export default function AdminMenuPage() {
  const utils = trpc.useUtils();
  const dishesQuery = trpc.menu.adminList.useQuery();
  const tagsQuery = trpc.menu.tags.useQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<DishForm | null>(null);
  const [deleting, setDeleting] = useState<Dish | null>(null);
  const [newTag, setNewTag] = useState("");
  const [uploading, setUploading] = useState(false);

  const invalidate = () => {
    utils.menu.adminList.invalidate();
    utils.menu.list.invalidate();
    utils.menu.tags.invalidate();
  };

  const createDish = trpc.menu.createDish.useMutation({
    onSuccess: () => {
      toast.success("菜品已新增");
      invalidate();
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateDish = trpc.menu.updateDish.useMutation({
    onSuccess: () => {
      toast.success("菜品已保存");
      invalidate();
      setEditing(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteDish = trpc.menu.deleteDish.useMutation({
    onSuccess: () => {
      toast.success("菜品已删除");
      invalidate();
      setDeleting(null);
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadImage = trpc.menu.uploadImage.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const removeImage = trpc.menu.removeImage.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const createTag = trpc.menu.createTag.useMutation({
    onSuccess: () => {
      toast.success("标签已创建");
      setNewTag("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const dishes = (dishesQuery.data ?? []) as unknown as Dish[];
  const allTags = (tagsQuery.data ?? []) as Tag[];
  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const d of dishes) {
      const arr = map.get(d.category) ?? [];
      arr.push(d);
      map.set(d.category, arr);
    }
    return [...map.entries()];
  }, [dishes]);

  const openEdit = (dish?: Dish) => {
    if (!dish) {
      setEditing({ ...emptyForm });
    } else {
      setEditing({
        id: dish.id,
        name: dish.name,
        nameRu: dish.nameRu ?? "",
        description: dish.description ?? "",
        descriptionRu: dish.descriptionRu ?? "",
        price: String(Number(dish.price)),
        category: dish.category,
        isAvailable: dish.isAvailable,
        tagIds: dish.tags.map((t) => t.id),
        imageUrl: dish.imageUrl,
      });
    }
  };

  const save = () => {
    if (!editing) return;
    const price = Number(editing.price);
    if (!editing.name.trim()) {
      toast.error("请填写菜品名称");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("价格必须是大于 0 的数字");
      return;
    }
    const payload = {
      name: editing.name.trim(),
      nameRu: editing.nameRu.trim() || undefined,
      description: editing.description || undefined,
      descriptionRu: editing.descriptionRu || undefined,
      price: Math.round(price * 100) / 100,
      category: editing.category.trim() || "其他",
      isAvailable: editing.isAvailable,
      tagIds: editing.tagIds,
    };
    if (editing.id) {
      updateDish.mutate({ id: editing.id, ...payload });
    } else {
      createDish.mutate(payload);
    }
  };

  const onPickImage = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      if (editing.id) {
        await uploadImage.mutateAsync({ dishId: editing.id, dataUrl });
        invalidate();
      }
      setEditing({ ...editing, imageUrl: dataUrl });
      toast.success("图片已上传");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-black tracking-wide">菜单管理</h1>
        <Button className="ml-auto rounded-full" onClick={() => openEdit()}>
          <Plus className="mr-1 h-4 w-4" />
          新增菜品
        </Button>
      </div>

      {/* 标签管理 */}
      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-sm font-medium">标签管理</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {allTags.map((t) => (
            <TagPill key={t.id} name={t.name} color={t.color} />
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="新标签名称"
              className="h-8 w-32"
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={!newTag.trim() || createTag.isPending}
              onClick={() => createTag.mutate({ name: newTag.trim() })}
            >
              添加标签
            </Button>
          </div>
        </div>
      </section>

      {/* 菜品列表 */}
      {dishesQuery.isLoading ? (
        <p className="mt-16 text-center text-muted-foreground">加载中…</p>
      ) : (
        grouped.map(([category, list]) => (
          <section key={category} className="mt-8">
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-display text-xl font-bold">{category}</h2>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{list.length} 道</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((dish) => (
                <article
                  key={dish.id}
                  className={`flex gap-3 rounded-2xl border border-border/60 bg-card p-3 ${
                    dish.isAvailable ? "" : "opacity-55"
                  }`}
                >
                  <DishImage imageUrl={dish.imageUrl} name={dish.name} className="h-20 w-20 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{dish.name}</p>
                      <span className="shrink-0 font-display font-bold text-primary">
                        {formatPrice(dish.price)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dish.tags.map((t) => (
                        <TagPill key={t.id} name={t.name} color={t.color} />
                      ))}
                      {!dish.isAvailable && (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                          已下架
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 rounded-full px-2.5 text-xs" onClick={() => openEdit(dish)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-full px-2.5 text-xs text-destructive"
                        onClick={() => setDeleting(dish)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        删除
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      {/* 编辑 / 新增对话框 */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.id ? "编辑菜品" : "新增菜品"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 图片 */}
                <div>
                  <Label>菜品图片（≤2MB，JPG/PNG/WebP/GIF）</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <DishImage imageUrl={editing.imageUrl} name={editing.name || "预览"} className="h-24 w-24 rounded-xl" />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="mr-1 h-4 w-4" />
                        {uploading ? "上传中…" : editing.imageUrl ? "更换图片" : "上传图片"}
                      </Button>
                      {editing.imageUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-destructive"
                          onClick={() => {
                            if (editing.id) removeImage.mutate({ dishId: editing.id });
                            setEditing({ ...editing, imageUrl: null });
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          移除图片
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        onPickImage(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {!editing.id && editing.imageUrl && (
                    <p className="mt-1 text-xs text-muted-foreground">图片将随保存一起生效</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label>菜品名称（中文）*</Label>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label>菜品名称（俄语）</Label>
                    <Input
                      value={editing.nameRu}
                      onChange={(e) => setEditing({ ...editing, nameRu: e.target.value })}
                      placeholder="Название блюда"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>价格（元）*</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>分类</Label>
                  <Input
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="如：汤类 / 俄式主菜 / 中式热菜"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>描述（中文）</Label>
                  <Textarea
                    rows={2}
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>描述（俄语）</Label>
                  <Textarea
                    rows={2}
                    value={editing.descriptionRu}
                    onChange={(e) => setEditing({ ...editing, descriptionRu: e.target.value })}
                    placeholder="Описание блюда"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>标签</Label>
                  <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 p-3">
                    {allTags.map((t) => (
                      <label key={t.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={editing.tagIds.includes(t.id)}
                          onCheckedChange={(checked) =>
                            setEditing({
                              ...editing,
                              tagIds: checked
                                ? [...editing.tagIds, t.id]
                                : editing.tagIds.filter((id) => id !== t.id),
                            })
                          }
                        />
                        <TagPill name={t.name} color={t.color} />
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={editing.isAvailable}
                    onCheckedChange={(v) => setEditing({ ...editing, isAvailable: v })}
                  />
                  上架销售（顾客端可见）
                </label>
                <Button
                  className="w-full rounded-full"
                  disabled={createDish.isPending || updateDish.isPending}
                  onClick={save}
                >
                  {createDish.isPending || updateDish.isPending ? "保存中…" : "保存"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          {deleting && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>删除菜品</AlertDialogTitle>
                <AlertDialogDescription>
                  确定删除「{deleting.name}」吗？已下单的历史订单不受影响，此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteDish.isPending}
                  onClick={() => deleteDish.mutate({ id: deleting.id })}
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
