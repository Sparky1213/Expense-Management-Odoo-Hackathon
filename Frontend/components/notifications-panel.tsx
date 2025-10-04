"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  type: "approval" | "rejection" | "submission"
  message: string
  timestamp: string
  read: boolean
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem("notifications")
    if (stored) {
      const notifs = JSON.parse(stored)
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length)
    }
  }, [])

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    localStorage.setItem("notifications", JSON.stringify(updated))
    setNotifications(updated)
    setUnreadCount(updated.filter((n) => !n.read).length)
  }

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    localStorage.setItem("notifications", JSON.stringify(updated))
    setNotifications(updated)
    setUnreadCount(0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${!notification.read ? "bg-accent/50" : ""}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <p className="text-sm">{notification.message}</p>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
