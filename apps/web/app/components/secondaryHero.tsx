import { Shield, Users, Zap } from "lucide-react";

interface SecondaryHeroProp {
  title: string,
  description: string,
  type: string
}
export default function SecondaryHero({ title, description, type }: SecondaryHeroProp) {

  return <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
      {type == "ZAP" ?
        <Zap className="w-6 h-6 text-blue-600" />
        : type == "SHIELD" ?
          <Shield className="w-6 h-6 text-cyan-600" />
          : <Users className="w-6 h-6 text-blue-600" />
      }
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600">
      {description}
    </p>
  </div>
}

