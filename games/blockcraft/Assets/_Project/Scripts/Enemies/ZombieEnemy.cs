using UnityEngine;

namespace BlockCraft
{
    public class ZombieEnemy : EnemyBase
    {
        // Zombie: walks toward player, melee attack, night-only, burns in daylight
        // All base behavior from EnemyBase is sufficient for zombie.
        // This subclass exists for any zombie-specific overrides.

        protected override void UpdateAI()
        {
            // Zombies are simple - just chase and attack
            base.UpdateAI();
        }

        protected override void Attack()
        {
            base.Attack();
            // Could add zombie-specific attack sound here
        }
    }
}
