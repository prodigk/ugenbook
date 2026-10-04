import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserLikes, toggleLike } from "@/lib/likesApi";
import { toast } from "@/hooks/use-toast";

const STORAGE_KEY = "ugenbook:favorites:v1";
function readGuestFavorites(): string[] {
  const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string"))
    throw new Error("즐겨찾기 데이터를 읽을 수 없습니다.");
  return [...new Set(value)] as string[];
}
interface FavoritesValue {
  ids: string[];
  loading: boolean;
  error: string;
  pending: Set<string>;
  toggle: (id: string) => Promise<void>;
  retry: () => void;
  accountSaved: boolean;
}
const FavoritesContext = createContext<FavoritesValue | null>(null);
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const owner = user?.id || "guest";
  const currentOwner = useRef(owner);
  currentOwner.current = owner;
  const [state, setState] = useState({
    owner: "",
    ids: [] as string[],
    loading: true,
    error: "",
  });
  const [pending, setPending] = useState(new Set<string>());
  const inFlight = useRef(new Set<string>());
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setState({ owner, ids: [], loading: true, error: "" });
    const load = async () => {
      try {
        const ids =
          owner === "guest"
            ? readGuestFavorites()
            : await fetchUserLikes(owner);
        if (!cancelled) setState({ owner, ids, loading: false, error: "" });
      } catch {
        if (!cancelled)
          setState({
            owner,
            ids: [],
            loading: false,
            error: "즐겨찾기를 불러오지 못했습니다. 다시 시도해 주세요.",
          });
      }
    };
    void load();
    const onStorage = (event: StorageEvent) => {
      if (
        owner === "guest" &&
        (event.key === STORAGE_KEY || event.key === null)
      )
        void load();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, [owner, authLoading, attempt]);
  const loading = authLoading || state.owner !== owner || state.loading;
  const ids = state.owner === owner ? state.ids : [];
  const toggle = async (id: string) => {
    const key = `${owner}:${id}`;
    if (loading || state.error || inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setPending(new Set(inFlight.current));
    const liked = ids.includes(id);
    try {
      if (owner === "guest") {
        const stored = readGuestFavorites();
        const next = liked
          ? stored.filter((value) => value !== id)
          : [...new Set([...stored, id])];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (currentOwner.current === owner)
          setState((prev) => ({ ...prev, ids: next }));
      } else {
        await toggleLike(owner, id, liked);
        if (currentOwner.current === owner)
          setState((prev) => ({
            ...prev,
            ids: liked
              ? prev.ids.filter((value) => value !== id)
              : [...new Set([...prev.ids, id])],
          }));
      }
      if (currentOwner.current === owner)
        toast({
          title: liked
            ? "즐겨찾기에서 해제했습니다."
            : "즐겨찾기에 추가했습니다.",
        });
    } catch {
      toast({
        title: "즐겨찾기 저장 실패",
        description: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      inFlight.current.delete(key);
      setPending(new Set(inFlight.current));
    }
  };
  return (
    <FavoritesContext.Provider
      value={{
        ids,
        loading,
        error: state.owner === owner ? state.error : "",
        pending: new Set(
          [...pending]
            .filter((key) => key.startsWith(`${owner}:`))
            .map((key) => key.slice(owner.length + 1)),
        ),
        toggle,
        retry: () => setAttempt((v) => v + 1),
        accountSaved: !!user,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("FavoritesProvider is required");
  return context;
}
