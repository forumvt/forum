import type {
  GameEventListener,
  GameEventPayload,
} from "@/lib/games/dungeon-survivor/types";

export class GameEventBus {
  private listeners = new Set<GameEventListener>();

  subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: GameEventPayload): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
