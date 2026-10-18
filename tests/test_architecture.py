import subprocess
from pathlib import Path


def test_architecture_check_passes():
    result = subprocess.run(["architecture", "check"], cwd=Path(__file__).resolve().parents[1],
                            capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
