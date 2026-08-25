"use client";

import {
  AlignCenter,
  Bold,
  Code,
  Eye,
  HelpCircle,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageSquareQuote,
  Pencil,
  Strikethrough,
  Underline,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { BBCodeContent } from "@/components/bbcode-content";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const COLORS = [
  { label: "Cor", value: "" },
  { label: "Vermelho", value: "red" },
  { label: "Azul", value: "blue" },
  { label: "Verde", value: "green" },
  { label: "Laranja", value: "orange" },
  { label: "Roxo", value: "purple" },
  { label: "Preto", value: "black" },
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28];

export interface BBCodeEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  disabled?: boolean;
  name?: string;
  compact?: boolean;
}

export function BBCodeEditor({
  id,
  value,
  onChange,
  placeholder = "Escreva sua mensagem... Use BBCode para formatar o texto.",
  minHeightClass = "min-h-[150px]",
  disabled,
  name,
  compact,
}: BBCodeEditorProps) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [tab, setTab] = useState("write");

  function applyWrap(open: string, close: string, placeholderText = "") {
    const textarea = innerRef.current ?? document.getElementById(id);
    if (!(textarea instanceof HTMLTextAreaElement)) {
      onChange(`${value}${open}${placeholderText}${close}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const inner = selected || placeholderText;
    const next =
      value.substring(0, start) + open + inner + close + value.substring(end);
    onChange(next);

    const cursor = start + open.length + inner.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selected ? start + open.length : cursor,
        selected ? start + open.length + inner.length : cursor,
      );
    });
  }

  function wrapTag(tag: string, placeholderText = "") {
    applyWrap(`[${tag}]`, `[/${tag}]`, placeholderText);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp((open) => !open)}
          aria-expanded={showHelp}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          <HelpCircle />
          BBCode
        </Button>
      </div>

      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleContent className="mb-2">
          <div className="bg-muted space-y-2 rounded-md p-3 text-sm">
            <p className="font-medium">Formatação BBCode</p>
            <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
              <HelpItem code="[b]negrito[/b]" label="Negrito" />
              <HelpItem code="[i]itálico[/i]" label="Itálico" />
              <HelpItem code="[u]sublinhado[/u]" label="Sublinhado" />
              <HelpItem code="[s]riscado[/s]" label="Riscado" />
              <HelpItem code="[url]https://exemplo.com[/url]" label="Link" />
              <HelpItem
                code="[url=https://exemplo.com]texto[/url]"
                label="Link com texto"
              />
              <HelpItem code="[color=red]texto[/color]" label="Cor" />
              <HelpItem code="[size=16]texto[/size]" label="Tamanho" />
              <HelpItem code="[code]código[/code]" label="Código" />
              <HelpItem code={"[list][*]item[/list]"} label="Lista" />
              <HelpItem code="[spoiler]oculto[/spoiler]" label="Spoiler" />
              <HelpItem code="[center]centro[/center]" label="Centralizar" />
              <HelpItem code="[quote=nome]citação[/quote]" label="Citação" />
              <HelpItem code="[img]URL[/img]" label="Imagem" />
              <HelpItem code="[youtube]URL[/youtube]" label="YouTube" />
              <HelpItem code="[twitter]URL[/twitter]" label="Tweet" />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="write">
            <Pencil />
            Escrever
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye />
            Pré-visualizar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="write" className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <ToolButton
              label="Negrito"
              onClick={() => wrapTag("b")}
              disabled={disabled}
            >
              <Bold />
            </ToolButton>
            <ToolButton
              label="Itálico"
              onClick={() => wrapTag("i")}
              disabled={disabled}
            >
              <Italic />
            </ToolButton>
            <ToolButton
              label="Sublinhado"
              onClick={() => wrapTag("u")}
              disabled={disabled}
            >
              <Underline />
            </ToolButton>
            <ToolButton
              label="Riscado"
              onClick={() => wrapTag("s")}
              disabled={disabled}
            >
              <Strikethrough />
            </ToolButton>
            <ToolButton
              label="Link"
              onClick={() => wrapTag("url", "https://")}
              disabled={disabled}
            >
              <Link2 />
            </ToolButton>
            <select
              aria-label="Cor do texto"
              disabled={disabled}
              defaultValue=""
              className="border-input bg-background h-8 rounded-md border px-2 text-xs"
              onChange={(e) => {
                if (e.target.value) {
                  applyWrap(`[color=${e.target.value}]`, "[/color]", "texto");
                }
                e.target.value = "";
              }}
            >
              {COLORS.map((color) => (
                <option key={color.label} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Tamanho do texto"
              disabled={disabled}
              defaultValue=""
              className="border-input bg-background h-8 rounded-md border px-2 text-xs"
              onChange={(e) => {
                if (e.target.value) {
                  applyWrap(`[size=${e.target.value}]`, "[/size]", "texto");
                }
                e.target.value = "";
              }}
            >
              <option value="">Tam.</option>
              {SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
            <ToolButton
              label="Código"
              onClick={() => wrapTag("code", "código")}
              disabled={disabled}
            >
              <Code />
            </ToolButton>
            <ToolButton
              label="Lista"
              onClick={() => applyWrap("[list]\n[*] ", "\n[/list]", "item")}
              disabled={disabled}
            >
              <List />
            </ToolButton>
            <ToolButton
              label="Lista numerada"
              onClick={() => applyWrap("[list=1]\n[*] ", "\n[/list]", "item")}
              disabled={disabled}
            >
              <ListOrdered />
            </ToolButton>
            <ToolButton
              label="Spoiler"
              onClick={() => wrapTag("spoiler", "conteúdo oculto")}
              disabled={disabled}
            >
              Spoiler
            </ToolButton>
            <ToolButton
              label="Centralizar"
              onClick={() => wrapTag("center")}
              disabled={disabled}
            >
              <AlignCenter />
            </ToolButton>
            <ToolButton
              label="Citação"
              onClick={() => wrapTag("quote", "citação")}
              disabled={disabled}
            >
              <MessageSquareQuote />
            </ToolButton>
            <ToolButton
              label="Imagem"
              onClick={() => wrapTag("img", "URL_DA_IMAGEM")}
              disabled={disabled}
            >
              <ImageIcon />
            </ToolButton>
            <ToolButton
              label="YouTube"
              onClick={() => wrapTag("youtube", "URL_DO_YOUTUBE")}
              disabled={disabled}
            >
              YouTube
            </ToolButton>
            <ToolButton
              label="Tweet"
              onClick={() => wrapTag("twitter", "URL_DO_TWEET")}
              disabled={disabled}
            >
              𝕏
            </ToolButton>
          </div>
          <Textarea
            ref={innerRef}
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "border-input resize-y font-mono text-sm focus:border-ring",
              minHeightClass,
            )}
          />
        </TabsContent>
        <TabsContent value="preview">
          <div
            className={cn(
              "border-border bg-card rounded-md border p-4",
              minHeightClass,
            )}
          >
            {value.trim() ? (
              <BBCodeContent content={value} compact={compact} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Nada para pré-visualizar ainda.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-8 px-2 text-xs"
    >
      {children}
    </Button>
  );
}

function HelpItem({ code, label }: { code: string; label: string }) {
  return (
    <div>
      <code className="bg-background rounded px-1">{code}</code>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
