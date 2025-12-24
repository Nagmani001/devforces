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
      <Sparkles className="w-10 h-10 text-blue-600" />
      <span className="text-3xl font-bold text-gray-900">{topic}</span>
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-600">{description}</p>
  </div>

})
