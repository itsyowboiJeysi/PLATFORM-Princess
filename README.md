# PlatformShield — Platform Security Tips & Architecture Guide
### Course ITA 216: Platform Architecture (Based on `Slides 3 - Platform Architecture.pdf`)

A high-contrast, token-driven retro terminal guide delivering 21 essential platform security tips derived directly from the 31-slide course syllabus.

---

## PDF Slide Analysis & Core Topics

1. **Layers of a Computing Platform (Slide 2, 5):**
   - **Hardware:** Physical execution substrate (CPU, RAM, storage, peripherals, TPM). Threat model: physical probing, side-channel attacks (Spectre/Meltdown).
   - **Firmware:** Low-level BIOS/UEFI pre-boot code. Threat model: Ring -2 SMM rootkits, SPI flash backdoors that persist across OS wipes.
   - **Operating System:** Supervisor enforcing memory isolation and ACLs (Ring 0 vs. Ring 3). Threat model: privilege escalation, kernel exploits.
   - **Applications:** User-space software and services. Threat model: RCE, injection, and unpatched CVEs.

2. **Mobile vs. Desktop Platforms (Slide 3):**
   - **Mobile (Android/iOS):** Strict app sandboxing, mandatory privilege permissions, high integration.
   - **Desktop (Windows/Linux/macOS):** Broad software ecosystem and flexibility, but larger attack surface.

3. **Cloud & Virtualization Platforms (Slide 4):**
   - Virtualization is the core enabling technology; Cloud is the service model built on top.
   - Cloud operates on the **Shared Responsibility Model**.

4. **Hardware Root of Trust & TPM 2.0 (Slides 8-16):**
   - **What it is:** An independent hardware cryptographic chip acting as a physical safe.
   - **Why it matters:** Stores keys/certs/passwords outside of CPU RAM, supports measured Secure Boot via Platform Configuration Registers (PCRs), and stops pre-boot rootkits.
   - **TPM 1.2 vs. TPM 2.0:** TPM 1.2 relied on broken SHA-1 and single owner auth. TPM 2.0 brings SHA-256 algorithm agility, ECC, and policy-based authorization (Windows 11 and enterprise standard).
   - **Limitations:** Cannot stop runtime OS malware after boot; physical chip attacks remain possible.

5. **UEFI & Chain of Trust Pipeline (Slides 11-12):**
   - Rule: **Verify before you trust.**
   - Sequential verification: 1. Root of Trust (TPM) -> 2. Firmware verifies Bootloader -> 3. Bootloader verifies OS Kernel -> 4. OS verifies Drivers & Apps.
   - **Integrity Failure:** Boot halts immediately if any signature or hash digest does not match.

6. **Virtualization Architecture & Hypervisors (Slides 17-23):**
   - Consolidated hardware, isolated environments, maximized resource utilization.
   - **Type 1 (Bare-Metal):** ESXi, Hyper-V, KVM. Direct hardware execution, highest performance, minimal attack surface.
   - **Type 2 (Hosted):** VirtualBox, Workstation. Runs on host OS; inherits all host OS flaws and vulnerabilities.

7. **Virtualization Security Threat Vectors (Slides 24-27):**
   - **Hyperjacking:** Attacker compromises hypervisor ("blue pill" rootkit), seizing total control of all guest VMs invisibly. Countermeasures: regular hypervisor patches, strict MFA, role separation.
   - **VM Escape:** Malicious code in a guest VM breaks boundary checks to execute on host. Countermeasures: disable unused virtual hardware, apply SELinux/AppArmor confinement.
   - **Misconfigurations:** Flat networks without VLANs, excessive admin privileges, default credentials, CPU/RAM overcommit DoS.

8. **VM Isolation, Networking & Snapshots (Slides 28-30):**
   - Strong separation and resource quotas.
   - **Secure VM Networking:** Virtual switches (vSwitch), 802.1Q VLAN segmentation, per-VM firewall rules, virtual IDS/IPS.
   - **Snapshot Rollback Risks:** Snapshots restore old unpatched CVE vulnerabilities and invalid certificates; RAM dumps leak plain-text keys. Best practice: encrypt snapshots and **always patch immediately after rollback**.

9. **Slide 31 Virtualization Hardening Best Practices:**
   - 1. Keep hypervisor updated and patched
   - 2. Enforce strict access controls and MFA
   - 3. Use security baselines (CIS, NIST SP 800-125)
   - 4. Monitor VM behavior with SIEM logs and alerts
   - 5. Encrypt VM images and storage at rest
   - 6. Segment virtual network traffic using VLANs
   - 7. Encrypt and control snapshot creation
   - 8. Regularly patch and update after rollback

---

## Interactive Features in the Web App
- **Telemetry Scoreboard:** Visualizing the 4 platform layers, 2 hypervisor types, 4 virtualization threat vectors, and 8 hardening controls.
- **Section 02 Architecture & Security Tips:** 6 modular knowledge cards covering Hardware TPM 2.0, UEFI & Chain of Trust, Type 1 vs Type 2 Hypervisors, Mobile Platform Sandboxing, Cloud & Shared Responsibility Model, and Platform Security Ethics.
- **Section 03 Threat Lab:** Virtualization risk simulation covering Hyperjacking ("Blue Pill"), VM Escape, Misconfigurations, and Snapshot Rollback attacks with interactive defense triggers.
- **Section 04 Security Toolkit:** 
  - **"Secure the Platform" Activity:** Interactive 8-point hardening lab with real-time defense posture integrity meter (0% Vulnerable to 100% Hardened) and auto-harden test controls.
  - **Retro CLI Terminal Auditor:** Fully interactive console supporting `tpm`, `uefi`, `hypervisor`, `mobile`, `cloud`, `ethics`, `escape`, `hyperjacking`, `snapshots`, `layers`, `toolkit`, `threatlab`, `checklist`, and `status`.
- **Slide Topic Modal Viewer:** Deep-dive modal explaining threat models, architectural significance, and recommended safeguards for all course concepts.

## Run
Open `index.html` in any modern web browser.
