import { Sparkles } from "lucide-react";
import { memo } from "react";

interface authTopPropType {
  topic: string,
  title: string,
  description: string
}
export default memo(function AuthTop({ topic, title, description }: authTopPropType) {
  return <div className="text-center mb-8">
    <div className="flex items-center justify-center gap-2 mb-4">
      <Sparkles className="w-10 h-10 text-primary" />
      <span className="text-3xl font-bold text-foreground">{topic}</span>
    </div>
    <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
    <p className="text-muted-foreground">{description}</p>
  </div>

})
