# Deploy (Important)
When deploying any compute engine that connects to Supabase, ensure it allows both IPv6 ingress and IPv6 egress.

This is a deployment requirement, not an optional optimization. If IPv6 traffic is blocked in either direction, connectivity to Supabase may fail or behave inconsistently depending on network path and environment.

## Requirement

- Enable IPv6 ingress.
- Enable IPv6 egress.
- Verify firewall, security group, VPC, container, and host-level network rules do not block IPv6 traffic.

## Why this matters

Supabase network paths may rely on IPv6 reachability. A compute engine that only permits IPv4, or that partially disables IPv6, can cause connection failures, intermittent timeouts, or environment-specific deployment issues.

## Deployment checklist

- Confirm the runtime environment has IPv6 enabled.
- Confirm inbound IPv6 traffic is allowed where applicable.
- Confirm outbound IPv6 traffic is allowed.
- Confirm DNS resolution and routing work correctly for IPv6 destinations.
- Re-test Supabase connectivity after deployment.
