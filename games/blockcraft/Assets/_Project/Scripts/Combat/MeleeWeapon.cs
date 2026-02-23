using UnityEngine;

namespace BlockCraft
{
    /// <summary>
    /// Component for melee weapon visual/animation. Attach to a weapon sprite child of the player.
    /// The actual damage logic is in PlayerCombat.
    /// </summary>
    public class MeleeWeapon : MonoBehaviour
    {
        [SerializeField] private float swingDuration = 0.2f;
        [SerializeField] private float swingAngle = 90f;

        private float _swingTimer;
        private bool _isSwinging;
        private float _startAngle;

        public void StartSwing(bool facingRight)
        {
            _isSwinging = true;
            _swingTimer = 0f;
            _startAngle = facingRight ? 45f : -45f;
        }

        private void Update()
        {
            if (!_isSwinging) return;

            _swingTimer += Time.deltaTime;
            float t = _swingTimer / swingDuration;

            if (t >= 1f)
            {
                _isSwinging = false;
                transform.localRotation = Quaternion.identity;
                return;
            }

            float angle = Mathf.Lerp(_startAngle, _startAngle - swingAngle, t);
            transform.localRotation = Quaternion.Euler(0, 0, angle);
        }
    }
}
