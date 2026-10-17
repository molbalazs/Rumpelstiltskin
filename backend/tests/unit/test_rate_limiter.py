"""Unit tests for the global counter rollback in rate_limiter."""
import logging
from unittest.mock import MagicMock

from botocore.exceptions import ClientError

from rate_limiter import _decrement

_ERROR = ClientError({"Error": {"Code": "InternalServerError"}}, "UpdateItem")


def test_decrement_succeeds_first_try():
    table = MagicMock()

    _decrement(table, "GLOBAL", "2026-10-17")

    assert table.update_item.call_count == 1


def test_decrement_retries_once_then_succeeds(caplog):
    table = MagicMock()
    table.update_item.side_effect = [_ERROR, None]

    with caplog.at_level(logging.ERROR, logger="rate_limiter"):
        _decrement(table, "GLOBAL", "2026-10-17")

    assert table.update_item.call_count == 2
    assert caplog.records == []


def test_decrement_logs_when_retry_fails(caplog):
    table = MagicMock()
    table.update_item.side_effect = [_ERROR, _ERROR]

    with caplog.at_level(logging.ERROR, logger="rate_limiter"):
        _decrement(table, "GLOBAL", "2026-10-17")

    assert table.update_item.call_count == 2
    assert len(caplog.records) == 1
    assert "pk=GLOBAL sk=2026-10-17" in caplog.records[0].getMessage()
