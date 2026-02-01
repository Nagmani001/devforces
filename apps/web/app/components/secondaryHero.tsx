import { Shield, Users, Zap } from "lucide-react";

interface SecondaryHeroProp {
  title: string,
  description: string,
  type: string
}
export default function SecondaryHero({ title, description, type }: SecondaryHeroProp) {

  return <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-border">
    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
      {type == "ZAP" ?
        <Zap className="w-6 h-6 text-primary" />
        : type == "SHIELD" ?
          <Shield className="w-6 h-6 text-cyan-500" />
          : <Users className="w-6 h-6 text-primary" />
      }
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground">
      {description}
    </p>
  </div>
}

