using System;
using UnityEngine;

namespace BlockCraft
{
    public class TimeManager : MonoBehaviour
    {
        public static TimeManager Instance { get; private set; }

        [SerializeField] private float dayDuration = Constants.DayDurationSeconds;
        [SerializeField] private float currentTime = 0.3f; // Start at dawn

        private int _dayCount = 1;

        public float NormalizedTime => currentTime;
        public int DayCount => _dayCount;
        public bool IsNight => currentTime >= Constants.NightStart || currentTime < Constants.DawnStart;
        public bool IsDusk => currentTime >= Constants.DuskStart && currentTime < Constants.NightStart;
        public bool IsDawn => currentTime >= Constants.DawnStart && currentTime < Constants.DayStart;
        public bool IsDay => currentTime >= Constants.DayStart && currentTime < Constants.DuskStart;

        public event Action OnNightStarted;
        public event Action OnDayStarted;
        public event Action<int> OnNewDay;

        private bool _wasNight;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            float prevTime = currentTime;
            currentTime += Time.deltaTime / dayDuration;

            if (currentTime >= 1f)
            {
                currentTime -= 1f;
                _dayCount++;
                OnNewDay?.Invoke(_dayCount);
            }

            // Detect night/day transitions
            bool isNightNow = IsNight;
            if (isNightNow && !_wasNight)
            {
                OnNightStarted?.Invoke();
                Debug.Log($"[TimeManager] Night {_dayCount} has begun!");
            }
            else if (!isNightNow && _wasNight)
            {
                OnDayStarted?.Invoke();
                Debug.Log($"[TimeManager] Day {_dayCount} has begun!");
            }
            _wasNight = isNightNow;
        }

        /// <summary>
        /// Returns ambient light multiplier (0=pitch dark, 1=full bright)
        /// </summary>
        public float GetAmbientLightLevel()
        {
            if (IsDay) return 1f;
            if (IsNight) return 0.15f;

            if (IsDawn)
            {
                float t = (currentTime - Constants.DawnStart) / (Constants.DayStart - Constants.DawnStart);
                return Mathf.Lerp(0.15f, 1f, t);
            }

            if (IsDusk)
            {
                float t = (currentTime - Constants.DuskStart) / (Constants.NightStart - Constants.DuskStart);
                return Mathf.Lerp(1f, 0.15f, t);
            }

            return 1f;
        }

        /// <summary>
        /// Returns sky color based on time of day
        /// </summary>
        public Color GetSkyColor()
        {
            Color dayColor = new Color(0.53f, 0.81f, 0.92f);     // Light blue
            Color dawnColor = new Color(1f, 0.6f, 0.3f);          // Orange
            Color nightColor = new Color(0.05f, 0.05f, 0.15f);    // Dark blue

            if (IsDay) return dayColor;
            if (IsNight) return nightColor;

            if (IsDawn)
            {
                float t = (currentTime - Constants.DawnStart) / (Constants.DayStart - Constants.DawnStart);
                return Color.Lerp(nightColor, dawnColor, t * 2f); // First half: night->dawn
            }

            if (IsDusk)
            {
                float t = (currentTime - Constants.DuskStart) / (Constants.NightStart - Constants.DuskStart);
                return Color.Lerp(dayColor, nightColor, t);
            }

            return dayColor;
        }

        public void SetTime(float normalizedTime)
        {
            currentTime = Mathf.Repeat(normalizedTime, 1f);
        }
    }
}
