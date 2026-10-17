import { Keeper } from './Keeper'
import { Platform } from './Platform'
import { Player } from './Player'

interface SceneProps {
  keeperTalking: boolean
  tries: number
}

export function Scene({ keeperTalking, tries }: SceneProps) {
  return (
    <section className="scene" aria-label="The keeper faces you">
      <div className="status status--foe">
        <div className="status-row">
          <span>KEEPER</span>
          <span>Lv99</span>
        </div>
        <div className="status-bar">
          <span>LOCK</span>
          <span className="bar">
            <span className="bar-fill" />
          </span>
        </div>
      </div>

      <div className="foe">
        <Keeper talking={keeperTalking} />
        <Platform className="platform--foe" />
      </div>

      <div className="hero">
        <Platform className="platform--hero" />
        <Player />
      </div>

      <div className="status status--hero">
        <div className="status-row">
          <span>YOU</span>
          <span>Lv1</span>
        </div>
        <div className="status-row status-row--small">
          <span>TRIES</span>
          <span data-testid="tries-count">{tries}</span>
        </div>
      </div>
    </section>
  )
}
