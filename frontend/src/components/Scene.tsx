import { Keeper } from './Keeper'

interface SceneProps {
  keeperTalking: boolean
}

export function Scene({ keeperTalking }: SceneProps) {
  return (
    <section className="scene" aria-label="The keeper slumps behind its counter">
      <p className="scene-sign" aria-hidden="true">
        The answer
        <br />
        is no.
      </p>
      <div className="scene-keeper">
        <Keeper talking={keeperTalking} />
      </div>
      <div className="scene-counter" />
    </section>
  )
}
