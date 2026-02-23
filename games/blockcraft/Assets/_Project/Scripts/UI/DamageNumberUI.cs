using UnityEngine;
using TMPro;

namespace BlockCraft
{
    public class DamageNumberUI : MonoBehaviour
    {
        [SerializeField] private float floatSpeed = 1.5f;
        [SerializeField] private float fadeDuration = 1f;
        [SerializeField] private float scaleStart = 1.2f;

        private TextMeshPro _text;
        private float _timer;
        private Color _color;

        public static DamageNumberUI Spawn(Vector3 position, float damage, Color color)
        {
            var go = new GameObject("DamageNumber");
            go.transform.position = position + new Vector3(Random.Range(-0.3f, 0.3f), 0.5f, 0);

            var dmgNum = go.AddComponent<DamageNumberUI>();
            dmgNum._color = color;

            var tmp = go.AddComponent<TextMeshPro>();
            tmp.text = Mathf.CeilToInt(damage).ToString();
            tmp.fontSize = 5;
            tmp.fontStyle = FontStyles.Bold;
            tmp.color = color;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.sortingOrder = 100;
            dmgNum._text = tmp;

            go.transform.localScale = Vector3.one * dmgNum.scaleStart;

            return dmgNum;
        }

        private void Update()
        {
            _timer += Time.deltaTime;

            // Float up
            transform.position += Vector3.up * floatSpeed * Time.deltaTime;

            // Fade
            float alpha = 1f - (_timer / fadeDuration);
            if (_text != null)
                _text.color = new Color(_color.r, _color.g, _color.b, alpha);

            // Scale down
            float scale = Mathf.Lerp(scaleStart, 0.8f, _timer / fadeDuration);
            transform.localScale = Vector3.one * scale;

            if (_timer >= fadeDuration)
                Destroy(gameObject);
        }
    }
}
