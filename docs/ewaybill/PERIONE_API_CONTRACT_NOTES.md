# PeriOne e-Way Bill Sandbox Contract Notes (Verified Public Docs)

Verification date: 2026-11-26

## Confirmed from PeriOne public documentation
- Sandbox base URL: `https://staging.perione.in`
- Authentication endpoint: `GET /ewaybillapi/v1.03/authenticate`
- Generate endpoint: `POST /ewaybillapi/v1.03/ewayapi/genewaybill`
- Cancel endpoint: `POST /ewaybillapi/v1.03/ewayapi/canewb`
- Retrieve bill details endpoint: `GET /ewaybillapi/v1.03/ewayapi/getewaybill`
- PeriOne describes sandbox token validity as 1 hour and production token validity as 6 hours.

## Scope in SYD
Only single-invoice e-Way Bill generation and cancellation. The API paths above are verified, but the exact PeriOne authentication headers/query requirements, request bodies, response encryption/decoding, cancellation reason codes, and provider credential fields still need the detailed sandbox contract/credential handoff. Do not infer these from the NIC API because PeriOne is the intermediary/provider and may implement its own proxy contract.

## References
- PeriOne e-Way Bill reference: https://www.perione.in/apis/ewaybill.html
- PeriOne e-Way Bill service page: https://perione.in/services/ewaybill/
- PeriOne docs portal: https://perione.in/docs/
- NIC e-Way Bill developer portal (official payload/encryption background, not to be assumed as PeriOne request format): https://docs.ewaybillgst.gov.in/apidocs/

## Guardrails
- Sandbox only.
- Production disabled.
- Keep API credentials server-side.
- Don't log raw credentials, tokens, complete sensitive payloads, or complete invoice data.
- Treat network timeouts as unknown outcomes and reconcile before retry.
