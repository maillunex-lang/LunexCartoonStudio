import json
from pathlib import Path
import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]

@pytest.mark.parametrize("kind", ["episode", "asset"])
def test_schema_valid_and_invalid(kind):
    schema = json.loads((ROOT / "schemas" / f"{kind}.schema.json").read_text())
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)
    valid = json.loads((ROOT / "examples" / f"{kind}.valid.json").read_text())
    invalid = json.loads((ROOT / "examples" / f"{kind}.invalid.json").read_text())
    assert not list(validator.iter_errors(valid))
    assert list(validator.iter_errors(invalid))
