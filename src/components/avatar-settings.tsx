"use client";

import { Upload, X } from "lucide-react";
import { CldUploadButton } from "next-cloudinary";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AvatarSettingsProps {
  user: User;
}

export function AvatarSettings({ user }: AvatarSettingsProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.image ?? null,
  );

  const handleUpload = async (secureUrl: string) => {
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: secureUrl }),
      });

      if (!res.ok) throw new Error("Falha ao salvar avatar no banco");

      setPreviewUrl(secureUrl);
      toast.success("Avatar atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar avatar no banco.");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao remover o avatar");

      setPreviewUrl(null);
      toast.success("Avatar removido com sucesso!");
      window.location.reload();
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Falha ao remover o avatar. Tente novamente.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="border-border size-20 shrink-0 border-2">
          <AvatarImage src={previewUrl || undefined} alt="" />
          <AvatarFallback className="bg-muted text-muted-foreground text-lg">
            {user.name?.split(" ")?.[0]?.[0]}
            {user.name?.split(" ")?.[1]?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          {/* Botão de upload direto para Cloudinary */}
          <CldUploadButton
            signatureEndpoint="/api/sign-image"
            options={{ folder: "avatars" }} // opcional: pasta no Cloudinary
            onSuccess={(result) => {
              if (
                result.info &&
                typeof result.info === "object" &&
                "secure_url" in result.info
              ) {
                handleUpload(result.info.secure_url as string);
              } else {
                console.error("Upload result missing secure_url");
                toast.error("Erro no upload: URL da imagem não encontrada");
              }
            }}
          >
            <Button type="button" variant="outline">
              <Upload />
              Alterar Avatar
            </Button>
          </CldUploadButton>
          {previewUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveAvatar}
            >
              <X />
              Remover Avatar
            </Button>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Upload direto no Cloudinary. Formatos aceitos: JPG, PNG, GIF.
      </p>
    </div>
  );
}
