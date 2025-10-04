"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, Circle } from "lucide-react"

interface WorkflowStep {
  name: string
  status: "completed" | "pending" | "rejected" | "upcoming"
  approver?: string
  timestamp?: string
  comments?: string
}

interface WorkflowStatusProps {
  steps: WorkflowStep[]
}

export function WorkflowStatus({ steps }: WorkflowStatusProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStepBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Upcoming</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
        <CardDescription>Track the approval progress of this expense</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                {getStepIcon(step.status)}
                {index < steps.length - 1 && <div className="w-0.5 h-12 bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">{step.name}</h4>
                  {getStepBadge(step.status)}
                </div>
                {step.approver && (
                  <p className="text-sm text-muted-foreground">
                    Approver: <span className="font-medium">{step.approver}</span>
                  </p>
                )}
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">{new Date(step.timestamp).toLocaleString()}</p>
                )}
                {step.comments && <p className="text-sm mt-2 p-2 bg-muted rounded-md italic">"{step.comments}"</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
