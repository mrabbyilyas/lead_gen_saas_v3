import { Search } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search companies
          </Label>
          <SidebarInput
            id="search"
            placeholder="Search companies..."
            className="pl-8 bg-muted/50 border-0 focus:bg-background"
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
