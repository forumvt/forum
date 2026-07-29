import { redirect } from "next/navigation"
import { Suspense } from "react"

import { AvatarSettings } from "@/components/avatar-settings"
import { SettingsSkeleton } from "@/components/settings-skeleton"
import { auth } from "@/lib/auth"

async function SettingsContent() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  })

  if (!session) {
    redirect("/")
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas configurações de conta e preferências.
        </p>
      </div>

      <div className="border-border bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Avatar</h2>
        <AvatarSettings user={session.user} />
      </div>
    </>
  )
}

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  )
}
