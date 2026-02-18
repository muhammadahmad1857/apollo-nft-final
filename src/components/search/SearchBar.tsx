// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Search, X } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { searchUsers } from "@/actions/users";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Input } from "@/components/ui/input";
// import { Skeleton } from "@/components/ui/skeleton";
// import { truncateAddress } from "@/lib/truncate";
// import Link from "next/link";

// type SearchResult = {
//   id: number;
//   walletAddress: string;
//   name: string | null;
//   avatarUrl: string | null;
// };

// export function SearchBar() {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<SearchResult[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);
//   const router = useRouter();
//   const searchRef = useRef<HTMLDivElement>(null);

//   // Debounced search
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(async () => {
//       if (query.trim().length > 0) {
//         setIsLoading(true);
//         try {
//           const users = await searchUsers(query);
//           setResults(users);
//           setIsOpen(true);
//         } catch (error) {
//           console.error("Search error:", error);
//           setResults([]);
//         } finally {
//           setIsLoading(false);
//         }
//       } else {
//         setResults([]);
//         setIsOpen(false);
//       }
//     }, 300);

//     return () => clearTimeout(delayDebounceFn);
//   }, [query]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleResultClick = () => {
//     setQuery("");
//     setResults([]);
//     setIsOpen(false);
//   };

//   const handleClear = () => {
//     setQuery("");
//     setResults([]);
//     setIsOpen(false);
//   };

//   return (
//     <div ref={searchRef} className="relative w-full max-w-md">
//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//         <Input
//           type="text"
//           placeholder="Search artists..."
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           className="pl-9 pr-9"
//         />
//         {query && (
//           <button
//             onClick={handleClear}
//             className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         )}
//       </div>

//       {/* Dropdown Results */}
//       {isOpen && (query.trim().length > 0) && (
//         <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
//           {isLoading ? (
//             <div className="p-2 space-y-2">
//               {[...Array(3)].map((_, i) => (
//                 <div key={i} className="flex items-center gap-3 p-2">
//                   <Skeleton className="h-10 w-10 rounded-full" />
//                   <div className="flex-1 space-y-2">
//                     <Skeleton className="h-4 w-32" />
//                     <Skeleton className="h-3 w-40" />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : results.length > 0 ? (
//             <div className="py-2">
//               {results.map((user) => (
//                 <Link                   key={user.id}
//  href={`/artist/${user.walletAddress}`} passHref>
//                 <button
//                   onClick={() => handleResultClick()}
//                   className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
//                 >
//                   <Avatar className="h-10 w-10">
//                     <AvatarImage src={user.avatarUrl||''} alt={user.name || "User"} />
//                     <AvatarFallback>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
//                   </Avatar>
//                   <div className="flex-1 text-left">
//                     <p className="font-medium text-sm">{user.name || "Unnamed Artist"}</p>
//                     <p className="text-xs text-muted-foreground">
//                       {truncateAddress(user.walletAddress)}
//                     </p>
//                   </div>
//                 </button>
//               </Link>
//               ))
//               }
//             </div>
//           ) : (
//             <div className="p-8 text-center text-muted-foreground">
//               <p className="text-sm">No artists found</p>
//               <p className="text-xs mt-1">Try a different search term</p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchUsers } from "@/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { truncateAddress } from "@/lib/truncate";
import Link from "next/link";

type SearchResult = {
  id: number;
  walletAddress: string;
  name: string | null;
  avatarUrl: string | null;
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsLoading(true);
        try {
          const users = await searchUsers(query);
          setResults(users);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-10" // extra space for loader
        />
        {isLoading && (
          <Loader2 className="absolute right-7 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <Link key={user.id} href={`/artist/${user.walletAddress}`} passHref>
                  <button
                    onClick={handleResultClick}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.name || "User"} />
                      <AvatarFallback>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{user.name || "Unnamed Artist"}</p>
                      <p className="text-xs text-muted-foreground">
                        {truncateAddress(user.walletAddress)}
                      </p>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No artists found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
