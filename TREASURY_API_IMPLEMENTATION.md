# Treasury API Implementation

## Overview

This implementation adds two new API endpoints to fetch real treasury data from
the ScholarshipTreasury smart contract on Stellar/Soroban.

## Endpoints

### GET /api/treasury/stats

Returns aggregated treasury statistics.

**Response:**

```json
{
	"total_deposited_usdc": "125400000000",
	"total_disbursed_usdc": "98200000000",
	"scholars_funded": 128,
	"active_proposals": 12,
	"donors_count": 47
}
```

### GET /api/treasury/activity

Returns recent treasury activity with pagination.

**Query Parameters:**

- `limit` (optional): Max events to return (1-100, default: 20)
- `offset` (optional): Number of events to skip (default: 0)

**Response:**

```json
{
	"events": [
		{
			"type": "deposit",
			"amount": "500000000",
			"address": "G...",
			"tx_hash": "...",
			"created_at": "2024-01-01T00:00:00Z"
		}
	]
}
```

## Files Created

- `server/src/controllers/treasury.controller.ts` - Business logic
- `server/src/routes/treasury.routes.ts` - Route definitions

## Files Modified

- `server/src/index.ts` - Registered treasury routes

## Configuration

Requires `SCHOLARSHIP_TREASURY_CONTRACT_ID` in `.env`
