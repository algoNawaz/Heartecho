import Link from "next/link"
import { Heart, Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold">HeartEcho</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A platform for sharing heartbreak stories and finding healing through words.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/stories" className="text-muted-foreground hover:text-foreground transition-colors">
                Browse Stories
              </Link>
              <Link href="/authors" className="text-muted-foreground hover:text-foreground transition-colors">
                Authors
              </Link>
              <Link href="/write" className="text-muted-foreground hover:text-foreground transition-colors">
                Write a Story
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </Link>
              <Link href="/guidelines" className="text-muted-foreground hover:text-foreground transition-colors">
                Community Guidelines
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HeartEcho. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
