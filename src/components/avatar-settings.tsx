"use client";

import { Upload, X } from "lucide-react";
import { CldUploadButton } from "next-cloudinary";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AvatarLimitStatus {
  limit: number;
  usedChanges: number;
  remainingChanges: number;
  resetsAt: string;
}

interface AvatarSettingsProps {
  user: User;
}

export function AvatarSettings({ user }: AvatarSettingsProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.image ?? null,
  );
  const [limitStatus, setLimitStatus] = useState<AvatarLimitStatus | null>(
    null,
  );
  const [loadingStatus, setLoadingStatus] = useState(true);

  const canChangeAvatar = (limitStatus?.remainingChanges ?? 0) > 0;

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/user/avatar");
        if (!res.ok) return;
        const data = (await res.json()) as AvatarLimitStatus;
        if (!cancelled) setLimitStatus(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (secureUrl: string) => {
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: secureUrl }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Falha ao salvar avatar no banco";
        throw new Error(message);
      }

      setPreviewUrl(secureUrl);
      if (data && typeof data.remainingChanges === "number") {
        setLimitStatus({
          limit: data.limit,
          usedChanges: data.usedChanges,
          remainingChanges: data.remainingChanges,
          resetsAt: data.resetsAt,
        });
      }
      toast.success("Avatar atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar avatar no banco.",
      );
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch("/api/user/avatar", {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : "Falha ao remover o avatar";
        throw new Error(message);
      }

      setPreviewUrl(null);
      if (data && typeof data.remainingChanges === "number") {
        setLimitStatus({
          limit: data.limit,
          usedChanges: data.usedChanges,
          remainingChanges: data.remainingChanges,
          resetsAt: data.resetsAt,
        });
      }
      toast.success("Avatar removido com sucesso!");
      window.location.reload();
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao remover o avatar. Tente novamente.",
      );
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
          <CldUploadButton
            signatureEndpoint="/api/sign-image"
            options={{ folder: "avatars" }}
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
            <Button type="button" variant="outline" disabled={!canChangeAvatar}>
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
              disabled={!canChangeAvatar}
            >
              <X />
              Remover Avatar
            </Button>
          )}
        </div>
      </div>

      <div className="text-muted-foreground space-y-1 text-sm">
        <p>Upload direto no Cloudinary. Formatos aceitos: JPG, PNG, GIF.</p>
        {!loadingStatus && limitStatus && (
          <p>
            Você pode alterar o avatar até {limitStatus.limit} vezes por dia.
            Restam {limitStatus.remainingChanges} alteração
            {limitStatus.remainingChanges === 1 ? "" : "ões"}.
            {limitStatus.remainingChanges === 0 &&
              " Tente novamente amanhã."}
          </p>
        )}
      </div>
    </div>
  );
}
