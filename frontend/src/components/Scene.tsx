import { Keeper } from './Keeper'
import { Player } from './Player'

interface SceneProps {
  keeperTalking: boolean
}

export function Scene({ keeperTalking }: SceneProps) {
  return (
    <section className="scene" aria-label="The keeper faces you">
      <div className="foe">
        <Keeper talking={keeperTalking} />
      </div>

      <div className="hero">
        <Player />
      </div>
    </section>
  )
}
