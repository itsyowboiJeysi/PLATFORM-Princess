// Platform Security Tips & Architecture Guide (ITA 216 — Slides 3)
document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------------------------------------------------------
     1. TOPIC KNOWLEDGE BASE (Derived directly from Slides 3 PDF)
     ------------------------------------------------------------------------- */
  const securityTopics = {
    "TPM 2.0 Specifications": {
      category: "HARDWARE-BASED TRUST (SLIDES 8-16)",
      title: "TPM 2.0: Hardware Root of Trust",
      detail: "A Trusted Platform Module (TPM) is an isolated hardware security chip that functions completely independently of the main CPU and OS. It acts like a tiny physical safe inside the computer, storing cryptographic keys, certificates, and passwords so malware scraping RAM cannot steal them.",
      significance: "Provides hardware-enforced trust instead of software-only promises. Protects against bootkits, unauthorized firmware modifications, and offline key theft.",
      safeguard: "Ensure hardware TPM 2.0 is enabled in UEFI firmware. Required for modern enterprise security and Windows 11."
    },
    "TPM 1.2 vs 2.0 Comparison": {
      category: "CRYPTOGRAPHIC EVOLUTION (SLIDE 13-14)",
      title: "Direct Comparison: TPM 1.2 vs. TPM 2.0",
      detail: "TPM 1.2 relied strictly on SHA-1 (now cryptographically deprecated) and RSA-2048 with single-owner authorization. TPM 2.0 introduces cryptographic algorithm agility with SHA-256/SHA-384, Elliptic Curve Cryptography (ECC), and policy-based multi-user authorization hierarchies.",
      significance: "SHA-1 collision attacks compromise TPM 1.2 measurements. TPM 2.0 provides quantum-resistant curve options and separate storage/endorsement/platform hierarchies.",
      safeguard: "Migrate all legacy infrastructure away from TPM 1.2 to TPM 2.0 with SHA-256 PCR banks."
    },
    "Chain of Trust Pipeline": {
      category: "BOOT INTEGRITY (SLIDE 12)",
      title: "Chain of Trust: Verify Before You Trust",
      detail: "A foundational process where each stage of the startup process strictly checks the digital signature and integrity of the next stage before handing over control: 1. Root of Trust (TPM/ROM key) -> 2. Firmware checks Bootloader -> 3. Bootloader checks OS Kernel -> 4. OS verifies Drivers & Applications.",
      significance: "If any signature or hash digest fails to match the trusted baseline, the boot process is halted immediately or critical alerts are raised, preventing rogue kernels from loading.",
      safeguard: "Lock UEFI with administrative passwords, enable Secure Boot, and maintain an updated forbidden signature database (dbx)."
    },
    "02 Firmware (UEFI)": {
      category: "PRE-BOOT ARCHITECTURE (SLIDE 11)",
      title: "UEFI: The Bridge Between Hardware & OS",
      detail: "Unified Extensible Firmware Interface (UEFI) is the modern replacement for traditional 16-bit legacy BIOS. When power connects, UEFI is the first code executed by the CPU, initializing RAM, motherboard chipsets, storage controllers, and launching the bootloader.",
      significance: "Because firmware executes in System Management Mode (Ring -2) prior to the OS kernel, firmware-level rootkits survive complete hard drive wipes and operating system reinstalls.",
      safeguard: "Enforce hardware write-protection on SPI flash chips and deploy cryptographically signed vendor firmware updates."
    },
    "Type 1 vs Type 2 VMM": {
      category: "VIRTUALIZATION ARCHITECTURE (SLIDE 21)",
      title: "Type 1 (Bare-Metal) vs. Type 2 (Hosted) Hypervisors",
      detail: "Type 1 hypervisors (VMware ESXi, Microsoft Hyper-V, KVM) run directly on physical server hardware, managing hardware resources with maximum efficiency and minimal attack surface. Type 2 hypervisors (VirtualBox, VMware Workstation) run on top of a host operating system.",
      significance: "Type 2 hypervisors inherit all security weaknesses, unpatched flaws, and kernel vulnerabilities of the host OS. A host OS compromise compromises all hosted guest VMs.",
      safeguard: "Always use Type 1 Bare-Metal hypervisors for production workloads, enterprise servers, and multi-tenant virtualization."
    },
    "Secure VM Networking": {
      category: "SECURE VM NETWORKING (SLIDE 29)",
      title: "Secure VM Networking: Virtual Switches & VLANs",
      detail: "Hypervisors utilize internal software switches (virtual switches) to route packet traffic between co-located guest VMs. Because inter-VM traffic never traverses physical ethernet cables, physical edge firewalls cannot inspect it.",
      significance: "Without segmentation, a compromised web server VM can attack an internal database VM on the same host over a flat virtual network.",
      safeguard: "Enforce 802.1Q VLAN workload isolation, apply micro-segmentation firewalls per VM, disable promiscuous mode, and integrate virtual IDS/IPS."
    },
    "VM Isolation Techniques": {
      category: "VM ISOLATION (SLIDE 28)",
      title: "VM Isolation: Strong Separation & Resource Quotas",
      detail: "Slide 28 dictates 4 foundational VM isolation techniques: 1. Strong Separation (each VM must act as an independent system), 2. Resource Allocation Controls (CPU, RAM, storage quotas to prevent DoS), 3. Access Control (prevent VM-to-VM unauthorized access), and 4. Snapshot Monitoring (detect rollback attacks).",
      significance: "Ensures that tenant workloads cannot breach sandbox boundaries or starve neighboring VMs of physical CPU/RAM capacity.",
      safeguard: "Enforce mandatory access controls (MAC/SELinux), strict tenant quotas, and VLAN segmentation."
    },
    "Hyperjacking Mitigation": {
      category: "VIRTUALIZATION THREATS (SLIDE 25)",
      title: "Hyperjacking: Compromised Hypervisor Takeover",
      detail: "Hyperjacking is a cyberattack where an adversary gains control of the hypervisor layer itself (such as a 'blue pill' rootkit attack). The attacker installs a malicious hypervisor underneath the OS or seizes the management console.",
      significance: "The hypervisor holds the highest privilege level. Once compromised, attackers can invisibly monitor VM memory, tamper with running services, exfiltrate data, or shut down all guest workloads.",
      safeguard: "Apply regular hypervisor patches, enforce Multi-Factor Authentication (MFA), isolate out-of-band management planes, and implement strict role separation."
    },
    "VM Escape Containment": {
      category: "VIRTUALIZATION THREATS (SLIDE 26)",
      title: "VM Escape: Breaking Isolation to the Host",
      detail: "An attack where malicious code executing inside a restricted guest virtual machine breaks through virtualization boundaries to gain code execution on the hypervisor or host system.",
      significance: "VM Escape violates the core premise of virtualization: isolation. Once on the host, the attacker seizes control of all other virtual machines sharing that physical hardware.",
      safeguard: "Disable unused virtual hardware (floppy drives, audio cards, unused USB emulation), maintain virtualization patches, and isolate device drivers."
    },
    "CIS Virtualization Baselines": {
      category: "MISCONFIGURATION DEFENSE (SLIDES 27, 31)",
      title: "Eliminating Risky Misconfigurations with CIS Benchmarks",
      detail: "Most virtualization breaches stem not from zero-day hypervisor bugs, but from administrator configuration errors: unsegmented flat networks, excessive guest VM privileges, default management credentials, and resource overcommitment.",
      significance: "Resource overcommit allows malicious or runaway VMs to consume 100% CPU/RAM, triggering Denial-of-Service (DoS) across other co-located tenants.",
      safeguard: "Audit environments against Center for Internet Security (CIS) Virtualization Benchmarks and NIST SP 800-125 guidelines."
    },
    "Snapshot Security": {
      category: "STATE PERSISTENCE & ROLLBACK (SLIDE 30)",
      title: "Snapshot Rollback Security: Recovery Point Risks",
      detail: "Snapshots capture full system state and volatile RAM for disaster recovery and testing. However, rolling back a virtual machine restores superseded CVE vulnerabilities, revoked certificates, and outdated security patches.",
      significance: "Snapshot disk bundles can also expose unencrypted sensitive data, volatile RAM memory dumps, and plain-text session keys.",
      safeguard: "Encrypt snapshot repositories at rest, strictly restrict creation permissions, and mandate an immediate vulnerability patch cycle after any rollback."
    },
    "Mobile Platform Security": {
      category: "MOBILE PLATFORMS (SLIDE 3)",
      title: "Mobile Security: Sandboxing & Hardware Integration",
      detail: "Mobile platforms (Android and iOS) are engineered from the ground up for portability, battery life, and tight hardware-software integration. Applications are strictly sandboxed into dedicated isolated UIDs, meaning one app cannot inspect another app's memory or files without explicit user consent.",
      significance: "Unlike open desktop platforms where applications inherit full user rights by default, mobile platforms enforce least privilege with granular runtime permission gates.",
      safeguard: "Never jailbreak or root devices, strictly review app permissions, and rely on hardware-backed keystores (Secure Enclave / Android StrongBox)."
    },
    "Mobile vs Desktop Comparison": {
      category: "PLATFORM ARCHITECTURAL COMPARISON (SLIDE 3)",
      title: "Mobile vs. Desktop Platforms: Security Boundaries",
      detail: "Desktop systems (Windows, macOS, Linux) provide expansive performance and deep customization for developer productivity, but introduce a much broader attack surface. Mobile platforms restrict raw OS access, sandbox execution, and mandate digital signature verification for all third-party binaries.",
      significance: "Compromising a desktop application often yields complete access to the user's home directory. In mobile, app sandboxing isolates threats from escalating to the wider platform.",
      safeguard: "Apply mobile-style containerization (Docker, Flatpak, Windows Sandbox) on desktop systems to limit lateral movement."
    },
    "Cloud & Shared Responsibility Model": {
      category: "CLOUD PLATFORMS (SLIDE 4)",
      title: "Cloud Security: The Shared Responsibility Model",
      detail: "Cloud platforms (AWS, Azure, Google Cloud) abstract physical servers and storage into on-demand scalable services. While virtualization provides the underlying hypervisor technology, cloud introduces the Shared Responsibility Model: the Cloud Service Provider (CSP) protects 'Security OF the Cloud' (physical data centers, host hardware, hypervisor layer), while the tenant customer protects 'Security IN the Cloud' (guest OS patching, IAM policies, application code, network security groups, and data encryption).",
      significance: "Assuming the cloud provider handles all security is a catastrophic misjudgment. Misconfigured cloud storage buckets, open security groups, and leaked API credentials are 100% the customer's legal and operational responsibility.",
      safeguard: "Enforce cloud posture management (CSPM), mandate MFA on all IAM accounts, enable encryption at rest with KMS, and configure strict Virtual Private Cloud (VPC) firewalls."
    },
    "Virtualization vs Cloud Difference": {
      category: "INFRASTRUCTURE PARADIGMS (SLIDE 4)",
      title: "Virtualization as Technology vs. Cloud as Service",
      detail: "Course Slide 4 highlights the core distinction: Virtualization is the software mechanism that partitions physical hardware into isolated virtual machines. Cloud computing is the business and operational service model built on top of virtualization, delivering elasticity, multi-tenancy, and metered billing.",
      significance: "Virtualization alone does not equal cloud. A traditional on-premises hypervisor lacks automated self-service provisioning, API orchestration, and elastic scaling.",
      safeguard: "Maintain rigorous hypervisor patch lifecycles whether managing private on-prem hypervisors or cloud-hosted IaaS instances."
    },
    "Platform Security Ethics": {
      category: "SECURITY ETHICS & GOVERNANCE (SLIDES 4, 25, 31)",
      title: "Platform Administration Ethics & Tenant Privacy",
      detail: "In platform security, hypervisor and firmware administrators operate with god-like privilege (Ring -1, Ring -2). Ethical platform engineering dictates that administrators must never use virtualization inspection tools to snoop on tenant memory, steal plaintext cryptographic keys from snapshot RAM, or tamper with customer telemetry.",
      significance: "Tenant trust is the cornerstone of shared computing. A breach of administrative ethics undermines the integrity of the entire infrastructure and violates legal compliance frameworks (GDPR, HIPAA, SOC 2).",
      safeguard: "Enforce strict separation of duties, cryptographically blind hypervisor storage with customer-managed keys (BYOK), log all admin actions to immutable write-once SIEMs, and enforce dual-custody authorization."
    },
    "Administrative Trust Baselines": {
      category: "ETHICS & GOVERNANCE (SLIDE 31)",
      title: "Ethical Baselines: Responsible Disclosure & Least Privilege",
      detail: "When security researchers or platform engineers discover critical vulnerabilities in hardware, firmware, or hypervisors (such as CPU side channels, UEFI rootkits, or VM escape flaws), ethical practice requires coordinated, responsible disclosure to vendors rather than public weaponization.",
      significance: "Premature public disclosure of Ring -1/Ring -2 exploits leaves millions of enterprise platforms defenseless before vendor microcode or kernel patches can be engineered.",
      safeguard: "Adhere to the FIRST/CISA vulnerability disclosure guidelines and enforce zero-trust administrative boundaries internally."
    }
  };

  /* -------------------------------------------------------------------------
     2. MODAL DIALOG CONTROLLER
     ------------------------------------------------------------------------- */
  const modal = document.querySelector("#retroModal");
  const modalCategoryBadge = document.querySelector("#modalCategoryBadge");
  const modalHeading = document.querySelector("#modalHeading");
  const modalDetail = document.querySelector("#modalDetail");
  const modalSignificance = document.querySelector("#modalSignificance");
  const modalSafeguard = document.querySelector("#modalSafeguard");
  const modalCloseBtn = document.querySelector("#modalCloseBtn");
  const modalDismissBtn = document.querySelector("#modalDismissBtn");

  function openTopicModal(topicKey) {
    const data = securityTopics[topicKey];
    if (!data || !modal) return;

    modalCategoryBadge.textContent = data.category;
    modalHeading.textContent = data.title;
    modalDetail.textContent = data.detail;
    modalSignificance.textContent = data.significance;
    modalSafeguard.textContent = data.safeguard;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeTopicModal() {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".topic-trigger").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const topicKey = el.dataset.topic || el.textContent.trim();
      openTopicModal(topicKey);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeTopicModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener("click", closeTopicModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeTopicModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeTopicModal();
    }
  });

  /* -------------------------------------------------------------------------
     3. INTERACTIVE "SECURE THE PLATFORM" ACTIVITY & CHECKLIST (Slide 31)
     ------------------------------------------------------------------------- */
  const checkBoxes = Array.from(document.querySelectorAll(".sec-chk"));
  const checkProgressLabel = document.querySelector("#checkProgressLabel");
  const checkProgressBar = document.querySelector("#checkProgressBar");
  const postureStatusBadge = document.querySelector("#postureStatusBadge");
  const btnResetChecklist = document.querySelector("#btnResetChecklist");
  const btnAutoHarden = document.querySelector("#btnAutoHarden");
  const btnDownloadChecklist = document.querySelector("#btnDownloadChecklist");

  function updateChecklistProgress() {
    const checkedCount = checkBoxes.filter((c) => c.checked).length;
    const total = checkBoxes.length;
    const pct = total > 0 ? (checkedCount / total) * 100 : 0;
    const roundedPct = Math.round(pct);

    if (checkProgressLabel) {
      checkProgressLabel.textContent = `${checkedCount} / ${total} VERIFIED (${roundedPct}% HARDENED)`;
    }
    if (checkProgressBar) {
      checkProgressBar.style.width = `${pct}%`;
    }
    if (postureStatusBadge) {
      if (checkedCount === 0) {
        postureStatusBadge.textContent = "VULNERABLE (0%)";
        postureStatusBadge.style.backgroundColor = "#dc2626";
        postureStatusBadge.style.color = "#ffffff";
      } else if (checkedCount === total) {
        postureStatusBadge.textContent = "100% PLATFORM HARDENED";
        postureStatusBadge.style.backgroundColor = "#16a34a";
        postureStatusBadge.style.color = "#ffffff";
      } else {
        postureStatusBadge.textContent = `HARDENING IN PROGRESS (${roundedPct}%)`;
        postureStatusBadge.style.backgroundColor = "#d97706";
        postureStatusBadge.style.color = "#ffffff";
      }
    }
  }

  checkBoxes.forEach((chk) => {
    chk.addEventListener("change", updateChecklistProgress);
  });

  if (btnResetChecklist) {
    btnResetChecklist.addEventListener("click", () => {
      checkBoxes.forEach((c) => (c.checked = false));
      updateChecklistProgress();
    });
  }

  if (btnAutoHarden) {
    btnAutoHarden.addEventListener("click", () => {
      checkBoxes.forEach((c) => (c.checked = true));
      updateChecklistProgress();
    });
  }

  if (btnDownloadChecklist) {
    btnDownloadChecklist.addEventListener("click", () => {
      const section = document.querySelector("#checklist-activity") || document.querySelector("#toolkit");
      if (section) section.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* -------------------------------------------------------------------------
     4. CATEGORY FILTER RAIL & SMOOTH REDIRECT
     ------------------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll(".filter-tag-btn");
  const projectCards = document.querySelectorAll(".project-card");
  const architectureSection = document.querySelector("#architecture");
  const architectureSubtitle = document.querySelector("#architectureSubtitle");

  const filterFeedback = {
    all: "Displaying all platform architecture modules & security tips (Slides 1-31).",
    hardware: "Showing Hardware Root of Trust & TPM 2.0 modules (Slides 8-16).",
    virtualization: "Showing Virtualization Architecture & Type-1 VMM isolation tips (Slide 21).",
    "cloud-mobile": "Showing Mobile Platform Sandboxing & Cloud Shared Responsibility tips (Slides 3-4).",
    ethics: "Showing Platform Administration Ethics & Responsible Disclosure (Slides 4, 31)."
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;

      projectCards.forEach((card) => {
        if (filter === "all" || card.dataset.category === filter) {
          card.style.display = "flex";
          card.classList.remove("filter-matched");
          void card.offsetWidth;
          card.classList.add("filter-matched");
        } else {
          card.style.display = "none";
          card.classList.remove("filter-matched");
        }
      });

      if (architectureSubtitle && filterFeedback[filter]) {
        architectureSubtitle.textContent = filterFeedback[filter];
      }

      // Smoothly redirect and scroll user directly to the filtered section
      if (architectureSection) {
        const topbarHeight = 75;
        const targetTop = architectureSection.getBoundingClientRect().top + window.pageYOffset - topbarHeight;
        window.scrollTo({
          top: targetTop,
          behavior: "smooth"
        });
      }
    });
  });

  /* -------------------------------------------------------------------------
     5. RETRO PLATFORM SECURITY CLI TERMINAL & PLATFORM DEFENDER GAME
     ------------------------------------------------------------------------- */
  const terminalForm = document.querySelector("#terminalForm");
  const terminalInput = document.querySelector("#terminalInput");
  const terminalOutput = document.querySelector("#terminalOutput");

  const terminalKnowledge = {
    game: "LAUNCHING PLATFORM DEFENDER: INCIDENT RESPONSE PROTOCOL...",
    play: "LAUNCHING PLATFORM DEFENDER: INCIDENT RESPONSE PROTOCOL...",
    help: "SECURITY TOOLKIT COMMAND LIST:\n- 'game'       : [NEW] Play Platform Defender Interactive CLI Game!\n- 'tpm'        : Hardware Root of Trust & Secure Boot (Slides 8-16)\n- 'uefi'       : Unified Extensible Firmware Interface & Pre-Boot (Slide 11)\n- 'hypervisor' : Type 1 Bare-Metal vs Type 2 Hosted (Slide 21)\n- 'mobile'     : Mobile Sandboxing & Permissions vs Desktop (Slide 3)\n- 'cloud'      : Cloud Infrastructure & Shared Responsibility Model (Slide 4)\n- 'ethics'     : Administrative Ethics & Tenant Confidentiality (Slide 4, 31)\n- 'escape'     : Virtual Machine Escape Mechanics (Slide 26)\n- 'hyperjacking': Blue Pill Hypervisor Takeover (Slide 25)\n- 'snapshots'  : Rollback Vulnerabilities & Mitigation (Slide 30)\n- 'layers'     : 4 Computing Platform Layers & Threat Vectors (Slides 2, 5)\n- 'toolkit'    : Interactive Security Toolkit Suite Overview\n- 'threatlab'  : Virtualization Threat Lab Matrix\n- 'checklist'  : Best Practices for Virtualization Hardening (Slide 31)\n- 'status'     : Live Platform Security Posture Status\n- 'clear'      : Wipe console buffer",
    tpm: "TPM 2.0 (SLIDES 8-16):\n- Hardware crypto coprocessor independent of CPU & OS.\n- Root of Trust: securely seals keys, certs, passwords in silicon.\n- Measures boot hashes into PCR registers (Platform Configuration Registers).\n- Stops pre-boot firmware rootkits. Required for Windows 11.\n- Limitations: cannot stop post-boot OS malware; physical laboratory attacks possible.",
    uefi: "UEFI FIRMWARE (SLIDE 11):\n- Modern replacement for legacy 16-bit BIOS.\n- Executes at power-on to initialize CPU, RAM, and controllers before OS loading.\n- Acts as the bridge between hardware and operating system.\n- Foundation of Secure Boot and cryptographic Chain of Trust.\n- Threat: SMM (Ring -2) rootkits persist across full hard drive wipes.",
    hypervisor: "HYPERVISOR TYPES (SLIDE 21):\n- Type 1 (Bare-Metal): Runs directly on physical hardware (VMware ESXi, Hyper-V). High performance, minimal attack surface.\n- Type 2 (Hosted): Runs on top of a host OS (VirtualBox, Workstation). High risk: inherits all host OS flaws.",
    mobile: "MOBILE SECURITY (SLIDE 3):\n- Engineered for portability and battery life with tight hardware-software coupling.\n- Mandatory app sandboxing: Each application runs under isolated UID permissions.\n- Sandboxing prevents applications from scraping memory or files of neighboring apps.\n- Contrast with Desktop: Desktops offer expansive flexibility but expose a wider attack surface.",
    cloud: "CLOUD SECURITY & RESPONSIBILITY (SLIDE 4):\n- Cloud platforms (AWS, Azure) abstract physical infrastructure into scalable services.\n- Virtualization is the core enabling technology; Cloud is the operational service model.\n- Shared Responsibility Model: Cloud Provider secures the infrastructure/hypervisor ('Security OF the Cloud'); Customer secures guest OS, access control, and data ('Security IN the Cloud').",
    ethics: "PLATFORM ETHICS & RESPONSIBILITY (SLIDES 4, 25, 31):\n- Hypervisors possess absolute machine privilege (Ring -1).\n- Tenant Confidentiality: Admins must never inspect tenant memory, access unencrypted snapshots, or snoop on customer data.\n- Least Privilege: Enforce multi-factor authentication, separation of duties, and no default credentials.\n- Responsible Disclosure: Immediately report firmware and hypervisor CVEs to vendors rather than exploiting them.",
    escape: "VM ESCAPE (SLIDE 26):\n- Exploit code inside a restricted guest breaks boundary to execute on host.\n- Threat: Controls all other hosted VMs, violating virtualization isolation.\n- Countermeasures: Disable unused virtual devices (floppy, sound, USB), apply mandatory access controls (SELinux/AppArmor).",
    hyperjacking: "HYPERJACKING (SLIDE 25):\n- Attacker installs malicious hypervisor underneath the OS ('blue pill' attack) or seizes VMM.\n- Threat: Hypervisor has highest privilege; attacker invisibly controls all VMs.\n- Countermeasures: Regular hypervisor patches, strict MFA, role-based access control.",
    snapshots: "SNAPSHOT SECURITY (SLIDE 30):\n- Snapshots save state for recovery/testing.\n- Risks: Rollback revives old unpatched CVE vulnerabilities and invalid certificates; RAM images can leak plain-text keys.\n- Best Practices: Encrypt snapshots, control creation permissions, ALWAYS patch immediately after rollback.",
    layers: "COMPUTING PLATFORM LAYERS (SLIDES 2 & 5):\n1. Hardware: CPU, RAM, storage, TPM (Risk: Side-channel attacks, physical tampering)\n2. Firmware: BIOS/UEFI, SPI flash (Risk: BIOS/UEFI rootkits, pre-boot backdoors)\n3. Operating System: Kernel, drivers, ACLs (Risk: Privilege escalation, kernel exploits)\n4. Applications: User services, web/DB (Risk: Malware, unpatched software CVEs)",
    toolkit: "SECURITY TOOLKIT FEATURES:\n1. 'Secure the Platform' Hardening Activity (Slide 31 checklist with live posture meter)\n2. Interactive CLI Terminal Platform Auditor\n3. Retro Modal Topic Deep-Dive Viewer\n4. Category Domain Filter Rail\n5. Platform Defender CLI Threat Mitigation Game",
    threatlab: "THREAT LAB SIMULATION MATRIX (SLIDES 24-30):\n- Threat #01: Hyperjacking ('Blue Pill' Hypervisor Seizure)\n- Threat #02: VM Escape (Guest-to-Host Boundary Breach)\n- Threat #03: Admin Misconfigurations (Overcommit DoS, Flat VLANs)\n- Threat #04: Snapshot Rollbacks (Stale CVE Reintroduction & RAM Leaks)",
    checklist: "SLIDE 31 BEST PRACTICES:\n1. Keep hypervisor updated & patched\n2. Enforce strict access control & MFA\n3. Use security baselines (CIS, NIST SP 800-125)\n4. Monitor VM behavior with logs & alerts\n5. Encrypt VM images & storage\n6. Segment virtual networking using VLANs\n7. Encrypt and control snapshots\n8. Regularly patch and update after rollback",
    reboot: "REBOOTING PLATFORM_SHIELD SYSTEM ROM (INITIALIZING SILICON ROOT OF TRUST)...",
    status: "STATUS: TPM 2.0 ANCHORED. CHAIN OF TRUST ENFORCED. HYPERVISOR BOUNDARIES VERIFIED. ALL PLATFORM CONTROLS OPERATIONAL."
  };

  /* -------------------------------------------------------------------------
     PLATFORM DEFENDER GAME ENGINE (50 Questions Pool - Random 5 Per Game)
     ------------------------------------------------------------------------- */
  const QUESTION_BANK = [
  {
    "id": 1,
    "title": "PRE-BOOT FIRMWARE TAMPERING (SPI FLASH ROOTKIT)",
    "ref": "SLIDES 8-16: HARDWARE ROOT OF TRUST",
    "threat": "An unsigned rootkit binary is attempting to hijack the bootloader execution before the OS kernel initializes.",
    "options": [
      "[1] tpm      : Enforce TPM 2.0 PCR attestation & UEFI Secure Boot signature checks",
      "[2] antivirus: Run user-space desktop antivirus scanner",
      "[3] ignore   : Allow bootloader to proceed without verification"
    ],
    "validKeys": [
      "1",
      "tpm",
      "secureboot",
      "uefi",
      "pcr"
    ],
    "success": "COUNTERMEASURE DEPLOYED! TPM 2.0 PCR attestation halted execution of unsigned bootkit binary. Chain of trust intact.",
    "failure": "BREACH! User-space antivirus cannot execute before the OS loads. The bootkit seized Ring -2 firmware control!",
    "hint": "Modern platform trust begins in silicon. TPM 2.0 seals keys and verifies bootloader hashes before software boots (Slide 12)."
  },
  {
    "id": 2,
    "title": "VIRTUAL MACHINE ESCAPE (VMM BOUNDARY BREACH)",
    "ref": "SLIDE 26: VM ESCAPE CONTAINMENT",
    "threat": "A malicious tenant in Guest VM #2 is sending malformed packets through legacy virtual floppy controller emulation to access the host hypervisor memory.",
    "options": [
      "[1] ram      : Allocate more physical RAM to the guest virtual machine",
      "[2] prune    : Prune unused legacy virtual devices & enforce SELinux MAC isolation boundaries",
      "[3] reboot   : Reboot the guest virtual machine"
    ],
    "validKeys": [
      "2",
      "prune",
      "selinux",
      "isolate",
      "escape",
      "mac"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Unused virtual hardware pruned and mandatory access controls contained the guest breach.",
    "failure": "BREACH! Allocating RAM or rebooting didn't stop the exploit. Malicious guest broke out onto the bare-metal host!",
    "hint": "Slide 26 dictates disabling unused virtual hardware (floppy, sound, unused USB) to eliminate attack surfaces."
  },
  {
    "id": 3,
    "title": "HYPERJACKING INTRUSION ('BLUE PILL' TAKEOVER)",
    "ref": "SLIDE 25: HYPERVISOR BOUNDARY DEFENSE",
    "threat": "An adversary compromised default console credentials and is attempting to inject a rootkit directly beneath the hypervisor layer (Ring -1).",
    "options": [
      "[1] mfa      : Enforce strict MFA, isolate out-of-band management plane & apply hypervisor microcode patch",
      "[2] firewall : Install desktop software firewall inside one guest VM",
      "[3] bridge   : Delete the virtual network switch bridge"
    ],
    "validKeys": [
      "1",
      "mfa",
      "patch",
      "hyperjack",
      "hyperjacking",
      "oob"
    ],
    "success": "COUNTERMEASURE DEPLOYED! MFA prevented management plane takeover and hypervisor microcode patch neutralized exploit.",
    "failure": "BREACH! The hypervisor holds highest privilege. Guest firewalls cannot stop a Ring -1 hyperjacking attack!",
    "hint": "Slide 25 requires MFA, regular hypervisor patches, and isolated out-of-band management consoles."
  },
  {
    "id": 4,
    "title": "STALE SNAPSHOT ROLLBACK (REVIVED CVEs & RAM EXPOSURE)",
    "ref": "SLIDE 30: SNAPSHOT SECURITY & DISASTER RECOVERY",
    "threat": "An automated recovery workflow rolled back a production VM to a 90-day-old snapshot, reviving deprecated SSL certificates and unpatched CVEs.",
    "options": [
      "[1] ignore   : Leave the VM running because it restored cleanly",
      "[2] rollback : Roll back to an even older snapshot from last year",
      "[3] repatch  : Trigger immediate re-patch cycle, rotate revoked keys & enforce snapshot encryption at rest"
    ],
    "validKeys": [
      "3",
      "repatch",
      "patch",
      "snapshot",
      "encrypt"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Immediate re-patch cycle applied and unencrypted volatile RAM dump purged.",
    "failure": "BREACH! Running an unpatched restored snapshot exposed known CVEs to automated internet scanners!",
    "hint": "Slide 30 mandates immediately patching and auditing systems after any snapshot rollback."
  },
  {
    "id": 5,
    "title": "MULTI-TENANT PRIVACY & MOBILE SANDBOXING CHALLENGE",
    "ref": "SLIDES 3-4, 31: MOBILE & ADMINISTRATIVE ETHICS",
    "threat": "A rogue third-party app requests arbitrary memory scraping rights, while an engineer attempts to peek into multi-tenant VM memory.",
    "options": [
      "[1] grant    : Grant broad system privileges to speed up data collection",
      "[2] sandbox  : Enforce mobile UID app sandboxing & strict ethical admin confidentiality (zero tenant snooping)",
      "[3] disable  : Disable runtime permission checks"
    ],
    "validKeys": [
      "2",
      "sandbox",
      "ethics",
      "leastprivilege",
      "privacy",
      "uid"
    ],
    "success": "COUNTERMEASURE DEPLOYED! UID app sandbox isolated the app; ethical admin policy blocked unauthorized tenant inspection.",
    "failure": "BREACH! Overly permissive rights violated multi-tenant confidentiality and tenant privacy!",
    "hint": "Slide 3 teaches mobile UID sandboxing; Slide 31 stresses ethical admin duty and zero-snooping."
  },
  {
    "id": 6,
    "title": "TPM 1.2 CRYPTOGRAPHIC AGILITY WEAKNESS",
    "ref": "SLIDES 13-14: TPM 1.2 VS TPM 2.0",
    "threat": "Legacy server fleet is running TPM 1.2 with hardcoded SHA-1 PCR banks, susceptible to hash collision attacks.",
    "options": [
      "[1] migrate  : Upgrade to TPM 2.0 supporting SHA-256 and cryptographic algorithm agility",
      "[2] compress : Compress SHA-1 hashes using gzip",
      "[3] ignore   : Continue trusting SHA-1 for pre-boot signatures"
    ],
    "validKeys": [
      "1",
      "migrate",
      "tpm 2.0",
      "agility",
      "sha-256"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Migrated to TPM 2.0 with SHA-256 banks and modern ECC curves.",
    "failure": "BREACH! SHA-1 is mathematically compromised. Adversary forged hash signatures to bypass integrity checks!",
    "hint": "Slide 13 highlights that TPM 2.0 provides algorithm agility (SHA-256) while TPM 1.2 was bound to deprecated SHA-1."
  },
  {
    "id": 7,
    "title": "TYPE-1 VS TYPE-2 HYPERVISOR ARCHITECTURAL SELECTION",
    "ref": "SLIDE 21: HYPERVISOR VMM TAXONOMY",
    "threat": "Production database cluster is being deployed on Type 2 hosted hypervisors (VirtualBox) on top of an unpatched desktop host OS.",
    "options": [
      "[1] baremetal: Redeploy to Type-1 Bare-Metal Hypervisor (ESXi, Hyper-V, KVM) directly on hardware",
      "[2] wallpaper: Change desktop host background wallpaper",
      "[3] ignore   : Keep Type 2 hypervisors for multi-tenant production"
    ],
    "validKeys": [
      "1",
      "baremetal",
      "type-1",
      "type 1",
      "esxi",
      "hyper-v",
      "kvm"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Type 1 hypervisor eliminated host OS dependency, dramatically shrinking attack surface.",
    "failure": "BREACH! Type 2 hypervisors inherit all host OS kernel exploits. Host compromise compromised all guest VMs!",
    "hint": "Slide 21 specifies Type 1 hypervisors run directly on server silicon with minimal overhead and maximum isolation."
  },
  {
    "id": 8,
    "title": "VIRTUAL SWITCH PROMISCUOUS MODE EXPLOIT",
    "ref": "SLIDE 29: SECURE VM NETWORKING",
    "threat": "An adversary in a compromised web server VM enabled promiscuous mode on the vSwitch to sniff unencrypted database packets from neighboring VMs.",
    "options": [
      "[1] permit   : Allow promiscuous mode so network engineers can debug",
      "[2] disable  : Reject Promiscuous Mode, enforce 802.1Q VLAN tags & apply MAC address lockdown",
      "[3] restart  : Restart the physical ethernet router"
    ],
    "validKeys": [
      "2",
      "disable",
      "promiscuous",
      "vlan",
      "lockdown"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Promiscuous mode blocked on vSwitch; tenant traffic isolated within dedicated VLANs.",
    "failure": "BREACH! Promiscuous mode enabled tenant snooping on all lateral traffic sharing the virtual port group!",
    "hint": "Slide 29 requires disabling promiscuous mode and MAC changes on virtual switches to block packet sniffing."
  },
  {
    "id": 9,
    "title": "DENIAL-OF-SERVICE VIA RESOURCE OVERCOMMITMENT",
    "ref": "SLIDES 27, 28: RESOURCE ALLOCATION CONTROLS",
    "threat": "A rogue tenant VM spawned a fork-bomb eating 100% of physical CPU cores and RAM, starving mission-critical services on the same host.",
    "options": [
      "[1] quota    : Enforce strict CPU/RAM reservation limits, resource quotas, and noisy-neighbor throttling",
      "[2] wait     : Wait for the rogue process to run out of memory naturally",
      "[3] clone    : Clone the affected VM 10 times"
    ],
    "validKeys": [
      "1",
      "quota",
      "reservation",
      "throttle",
      "limits"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Hardware resource quotas clamped rogue VM consumption and preserved neighboring VMs.",
    "failure": "BREACH! Resource exhaustion triggered hypervisor kernel panic and total platform outage across all tenants!",
    "hint": "Slide 28 dictates Resource Allocation Controls as a mandatory VM isolation pillar against DoS."
  },
  {
    "id": 10,
    "title": "UEFI SECURE BOOT REVOCATION DATABASE (DBX) GAP",
    "ref": "SLIDES 11-12: SECURE BOOT INTEGRITY",
    "threat": "A known vulnerable bootloader (affected by BlackLotus bootkit) is loading on a server with an outdated forbidden signature database.",
    "options": [
      "[1] dbx      : Update UEFI dbx (revocation database) with latest cryptographic vendor hashes",
      "[2] disable  : Disable Secure Boot entirely in firmware menu",
      "[3] bios     : Downgrade motherboard to legacy 1981 16-bit BIOS"
    ],
    "validKeys": [
      "1",
      "dbx",
      "revocation",
      "blacklist",
      "update"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Revoked binary signature matched in dbx; boot process instantly halted.",
    "failure": "BREACH! Outdated revocation list allowed known compromised bootloader to bypass signature checks!",
    "hint": "Slide 12: Secure Boot relies on signature databases (db/dbx) to block known compromised binaries."
  },
  {
    "id": 11,
    "title": "CLOUD SHARED RESPONSIBILITY: INFRASTRUCTURE VS TENANT",
    "ref": "SLIDE 4: CLOUD RESPONSIBILITY MODEL",
    "threat": "A company suffered a data breach after leaving an AWS S3 bucket publicly readable, blaming the cloud provider for the incident.",
    "options": [
      "[1] govern   : Audit tenant-side configurations; remember provider secures 'OF' the cloud, tenant secures 'IN' the cloud",
      "[2] sue      : File lawsuit claiming cloud provider must configure tenant access controls",
      "[3] abandon  : Abandon cloud and delete all backups"
    ],
    "validKeys": [
      "1",
      "govern",
      "shared responsibility",
      "in the cloud",
      "tenant"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Aligned with Shared Responsibility Model: Customer actively audits access policies & data encryption.",
    "failure": "BREACH! Misunderstanding cloud boundaries caused repeated exposure. Tenant remains 100% accountable for data governance!",
    "hint": "Slide 4: Cloud providers secure the physical infrastructure; customers are strictly responsible for data and identity."
  },
  {
    "id": 12,
    "title": "MOBILE APP PERMISSION ELEVATION ATTEMPT",
    "ref": "SLIDE 3: MOBILE SECURITY PARADIGMS",
    "threat": "A flashlight utility application requests ACCESS_FINE_LOCATION, READ_CONTACTS, and SYSTEM_ALERT_WINDOW permissions.",
    "options": [
      "[1] grantall : Click 'Allow All' to eliminate annoying permission popups",
      "[2] deny     : Enforce principle of least privilege, deny unnecessary scopes & isolate in UID container",
      "[3] root     : Root the phone to bypass permission prompts"
    ],
    "validKeys": [
      "2",
      "deny",
      "least privilege",
      "sandbox",
      "permissions"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Unjustified permissions revoked; app isolated in standard UID sandbox.",
    "failure": "BREACH! Excessive permissions allowed flashlight app to stealthily harvest user geolocation and contacts!",
    "hint": "Slide 3: Mobile platforms employ granular runtime permissions to enforce least privilege against overreaching apps."
  },
  {
    "id": 13,
    "title": "HARDWARE ENCLAVE SECRETS MANAGEMENT",
    "ref": "SLIDES 3, 10: SILICON SECURITY ROOTS",
    "threat": "Developer plans to hardcode payment decryption keys inside mobile application source code and store them in app local storage.",
    "options": [
      "[1] enclave  : Store keys inside hardware keystore (Apple Secure Enclave / Android StrongBox)",
      "[2] base64   : Encode the key with Base64 in strings.xml",
      "[3] comments : Hide the secret key in code comments"
    ],
    "validKeys": [
      "1",
      "enclave",
      "keystore",
      "strongbox",
      "silicon"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Cryptographic keys anchored in dedicated silicon enclave immune to memory scraping.",
    "failure": "BREACH! Decompiling the APK extracted the hardcoded key in seconds, compromising all customer card data!",
    "hint": "Slide 3 & 10: Secrets must reside in tamper-resistant silicon hardware keystores, never in raw app code."
  },
  {
    "id": 14,
    "title": "SNAPSHOT RAM IN-MEMORY CREDENTIAL SCRAPING",
    "ref": "SLIDE 30: SNAPSHOT STATE PERSISTENCE",
    "threat": "A virtual machine snapshot includes a raw volatile memory dump containing cleartext database administrative passwords in RAM.",
    "options": [
      "[1] encrypt  : Enforce AES-256 encryption on all snapshot repositories & restrict VM snapshot export privileges",
      "[2] pastebin : Upload snapshot bundle to shared developer FTP",
      "[3] rename   : Rename the .vmem file extension to .txt"
    ],
    "validKeys": [
      "1",
      "encrypt",
      "aes",
      "permissions",
      "restrict"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Snapshot repository encrypted at rest with RBAC access control enforcing least privilege.",
    "failure": "BREACH! Unencrypted snapshot memory file stolen from storage share, exposing root database credentials!",
    "hint": "Slide 30 warns snapshots capture full RAM state, requiring storage encryption and strict role separation."
  },
  {
    "id": 15,
    "title": "OUT-OF-BAND MANAGEMENT CONSOLE EXPOSURE",
    "ref": "SLIDE 25: HYPERVISOR MANAGEMENT SECURITY",
    "threat": "Server motherboard IPMI/iLO out-of-band management interface is exposed directly to the public internet with default vendor password.",
    "options": [
      "[1] isolate  : Place management plane on dedicated isolated out-of-band VLAN, change defaults & enforce VPN/MFA",
      "[2] bookmark : Bookmark IPMI URL in public browser for easy remote access",
      "[3] rename   : Rename server hostname to 'NOT_A_SERVER'"
    ],
    "validKeys": [
      "1",
      "isolate",
      "vlan",
      "mfa",
      "vpn",
      "oob"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Out-of-band interface quarantined into private management subnet with mandatory MFA.",
    "failure": "BREACH! Adversaries brute-forced default IPMI credentials and seized out-of-band hardware console control!",
    "hint": "Slide 25 emphasizes keeping hypervisor management networks strictly isolated from public routing."
  },
  {
    "id": 16,
    "title": "RESPONSIBLE DISCLOSURE ETHICAL PROTOCOL",
    "ref": "SLIDES 4, 31: PLATFORM ETHICS & GOVERNANCE",
    "threat": "Security engineer discovers a critical zero-day VM Escape vulnerability in a hypervisor version used by Fortune 500 banks.",
    "options": [
      "[1] exploit  : Sell exploit code on dark web forums for personal financial gain",
      "[2] disclose : Follow coordinated responsible disclosure, report to vendor under embargo, and await patched firmware",
      "[3] tweet    : Post full working exploit on public social media immediately"
    ],
    "validKeys": [
      "2",
      "disclose",
      "responsible",
      "vendor",
      "embargo"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Practiced ethical responsible disclosure, allowing vendor to engineer and distribute patches.",
    "failure": "BREACH OF ETHICS! Public exploit dropping leaves millions of platforms defenseless before fixes exist!",
    "hint": "Slide 31 stresses administrative ethics and responsible vulnerability disclosure to protect global computing infrastructure."
  },
  {
    "id": 17,
    "title": "SPI FLASH WRITE-PROTECTION LOCK",
    "ref": "SLIDES 11, 16: FIRMWARE INTEGRITY",
    "threat": "Firmware update utility allows software to flash the motherboard BIOS chip without hardware verification jumper or write-protection bits.",
    "options": [
      "[1] lock     : Enforce hardware write-protect (WP) pin, cryptographically signed capsular updates & vendor key validation",
      "[2] permit   : Allow any arbitrary binary to flash the motherboard ROM",
      "[3] fan      : Increase CPU fan speed"
    ],
    "validKeys": [
      "1",
      "lock",
      "write-protect",
      "signed",
      "capsule"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Hardware write-protection and cryptographic capsule signatures blocked rogue flashing.",
    "failure": "BREACH! Rogue firmware flashed to SPI flash, creating an undetectable SMM rootkit surviving OS reinstalls!",
    "hint": "Slide 11: Firmware sits between silicon and OS; write-protection prevents unauthorized pre-boot replacement."
  },
  {
    "id": 18,
    "title": "COLD BOOT RAM SCRAPING ATTACK",
    "ref": "SLIDES 8, 10: PHYSICAL & SILICON ATTACKS",
    "threat": "Physical intruder sprayed liquid nitrogen on server DRAM chips, power-cycled machine, and transferred RAM to another board to extract BitLocker keys.",
    "options": [
      "[1] tpmseal  : Seal keys inside TPM with PIN + PCR measurements, and enable memory bus encryption (Total Memory Encryption)",
      "[2] heater   : Put a portable space heater next to the server rack",
      "[3] postit   : Write BitLocker recovery key on sticky note attached to monitor"
    ],
    "validKeys": [
      "1",
      "tpmseal",
      "tme",
      "pin",
      "pcr",
      "encryption"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Hardware memory encryption and TPM PCR validation rendered cold RAM scrapings unreadable.",
    "failure": "BREACH! Raw keys extracted from frozen memory remanence because RAM was unencrypted on memory bus!",
    "hint": "Slide 10 discusses TPM limitations against physical hardware lab attacks and the need for memory encryption."
  },
  {
    "id": 19,
    "title": "VIRTUAL NETWORK MICRO-SEGMENTATION",
    "ref": "SLIDE 29: SECURE VM NETWORKING",
    "threat": "A web tier VM, application tier VM, and database VM all share a single flat virtual switch network without internal firewall rules.",
    "options": [
      "[1] microseg : Implement micro-segmentation with distributed stateful firewall policies isolating VM-to-VM traffic",
      "[2] flatten  : Merge all corporate subnets into one big broadcast domain",
      "[3] speed    : Upgrade network cards to 100 Gbps"
    ],
    "validKeys": [
      "1",
      "microseg",
      "firewall",
      "segmentation",
      "isolate"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Distributed firewall blocked lateral movement between web tier and database tier.",
    "failure": "BREACH! Web server compromise allowed trivial lateral pivot directly into database VM across the flat network!",
    "hint": "Slide 29: Inter-VM traffic never hits physical firewalls; internal virtual segmentation is required."
  },
  {
    "id": 20,
    "title": "JAILBREAKING & ROOTING RISKS",
    "ref": "SLIDE 3: MOBILE SECURITY INTEGRITY",
    "threat": "Corporate employee requests permission to root/jailbreak their corporate mobile phone to install unvetted third-party tweak tools.",
    "options": [
      "[1] block    : Enforce MDM policy blocking rooted/jailbroken devices; rooting strips OS sandboxing protections",
      "[2] approve  : Encourage rooting so employees can customize system fonts",
      "[3] share    : Share rooting tutorial across company newsletter"
    ],
    "validKeys": [
      "1",
      "block",
      "mdm",
      "jailbreak",
      "rooting",
      "sandbox"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Device quarantined by MDM; platform integrity check verified untouched kernel root of trust.",
    "failure": "BREACH! Jailbroken device stripped sandbox boundaries; malicious sideloaded app scraped corporate emails!",
    "hint": "Slide 3: Mobile security relies on inviolable OS sandboxing; jailbreaking shatters this core boundary."
  },
  {
    "id": 21,
    "title": "RING PRIVILEGE LEVEL COMPREHENSION",
    "ref": "SLIDE 5, 21: PLATFORM PRIVILEGE RINGS",
    "threat": "Auditor asks which privilege tier executes with higher authority than the OS Kernel (Ring 0).",
    "options": [
      "[1] hypervisor: Ring -1 (Hypervisor / VMM) and Ring -2 (System Management Mode / SMM)",
      "[2] userspace : Ring 3 (User-space Web Browser)",
      "[3] keyboard  : USB Keyboard Controller driver in Ring 3"
    ],
    "validKeys": [
      "1",
      "ring -1",
      "hypervisor",
      "smm",
      "ring -2"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Correctly identified hardware privilege hierarchy: Ring -1 (VMM) and Ring -2 (SMM) govern Ring 0.",
    "failure": "BREACH! Misunderstanding privilege levels led to deploying monitoring tools in rings lower than the attacker!",
    "hint": "Slide 5 & 21: Hypervisors execute at Ring -1 beneath the OS kernel (Ring 0)."
  },
  {
    "id": 22,
    "title": "ZOMBIE VM SPRAWL & UNMONITORED WORKLOADS",
    "ref": "SLIDES 27, 31: VIRTUALIZATION BEST PRACTICES",
    "threat": "Cloud cluster has 40 abandoned test VMs running old Linux distributions with unpatched OpenSSL vulnerabilities, forgotten by developers.",
    "options": [
      "[1] decommission: Enforce VM lifecycle management, audit shadow instances with SIEM, and decommission orphan VMs",
      "[2] hide        : Hide the virtual machines in an unindexed folder",
      "[3] ignore      : Leave them running since nobody is actively using them"
    ],
    "validKeys": [
      "1",
      "decommission",
      "lifecycle",
      "audit",
      "siem",
      "prune"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Automated compliance audit identified and cleanly terminated unmonitored shadow VMs.",
    "failure": "BREACH! Abandoned zombie VM compromised by botnet and used as a permanent covert foothold!",
    "hint": "Slide 31 mandates active inventory logging and continuous lifecycle management of virtual workloads."
  },
  {
    "id": 23,
    "title": "TPM SEALING VS MEASURED BOOT",
    "ref": "SLIDE 12: CHAIN OF TRUST",
    "threat": "Engineers need a mechanism where hard drive encryption keys are only decrypted if the bootloader and firmware hashes remain 100% untampered.",
    "options": [
      "[1] seal    : Utilize TPM Key Sealing bound directly to verified Platform Configuration Registers (PCRs)",
      "[2] textfile: Save decryption key in plain text on USB flash drive plugged into server",
      "[3] password: Use 'admin123' as universal boot passphrase"
    ],
    "validKeys": [
      "1",
      "seal",
      "tpm",
      "pcr",
      "sealing"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Keys sealed to PCR state; any boot modification automatically locks disk access.",
    "failure": "BREACH! Without TPM PCR sealing, attackers booting live Linux USB could read all customer storage volumes!",
    "hint": "Slide 12: TPM sealing releases encryption secrets only when current PCR measurements match the expected baseline."
  },
  {
    "id": 24,
    "title": "VIRTUAL DISK FILE THEFT (VMDK / VHD EXTRACTION)",
    "ref": "SLIDE 31: VM IMAGE ENCRYPTION",
    "threat": "A rogue SAN storage administrator copies a 500GB production SQL database virtual disk file (.vmdk) to an external SSD.",
    "options": [
      "[1] vmcrypt : Implement VM encryption at rest (vSphere VM Encryption / BitLocker VHDX) so copied disk files are unreadable",
      "[2] rename  : Change file extension from .vmdk to .mp4",
      "[3] zip     : Add a password to a ZIP file using ZipCrypto"
    ],
    "validKeys": [
      "1",
      "vmcrypt",
      "encryption",
      "bitlocker",
      "at rest"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Copied VMDK encrypted with KMS keys; raw storage blocks impossible to mount without authorization.",
    "failure": "BREACH! Unencrypted virtual disk mounted on external workstation in 10 seconds, dumping all SQL records!",
    "hint": "Slide 31 emphasizes encrypting virtual machine images and storage volumes at rest."
  },
  {
    "id": 25,
    "title": "CIS VIRTUALIZATION BENCHMARK AUDIT",
    "ref": "SLIDE 31: SECURITY BASELINES",
    "threat": "Auditor asks which globally recognized security baseline should guide hypervisor hardening across enterprise clusters.",
    "options": [
      "[1] cisbench : Center for Internet Security (CIS) Virtualization Benchmarks and NIST SP 800-125",
      "[2] forum    : Unofficial gaming forum optimization guide from 2012",
      "[3] reddit   : Random Reddit post recommending disabling all firewalls"
    ],
    "validKeys": [
      "1",
      "cis",
      "cisbench",
      "nist",
      "800-125"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Platform hardened according to CIS Benchmarks and NIST SP 800-125 virtualization standards.",
    "failure": "BREACH! Ad-hoc configuration left 14 default credentials and open management ports exposed!",
    "hint": "Slide 31 recommends CIS Virtualization Benchmarks and NIST SP 800-125 as authoritative platform guides."
  },
  {
    "id": 26,
    "title": "SEPARATION OF DUTIES: GUEST VS HOST ADMINS",
    "ref": "SLIDES 4, 31: ETHICAL ADMIN CONTROLS",
    "threat": "Application developer requests full root/administrator access to the bare-metal ESXi hypervisor to check application logs.",
    "options": [
      "[1] deny   : Deny request; enforce separation of duties granting app dev access only to their specific guest VM logs",
      "[2] grant  : Grant root hypervisor credentials so developer stops submitting helpdesk tickets",
      "[3] share  : Share master hypervisor root password in team Slack channel"
    ],
    "validKeys": [
      "1",
      "deny",
      "separation",
      "least privilege",
      "rbac"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Strict separation of duties preserved; hypervisor management plane restricted to vetted infrastructure team.",
    "failure": "BREACH! Giving developers hypervisor root access compromised isolation across all neighboring tenant virtual machines!",
    "hint": "Slide 31 & 4: Administrative ethics require strict separation between guest workload roles and host hypervisor authority."
  },
  {
    "id": 27,
    "title": "MAC ADDRESS SPOOFING ON VIRTUAL SWITCH",
    "ref": "SLIDE 29: VIRTUAL NETWORKING ATTACKS",
    "threat": "A malicious virtual machine changes its virtual NIC MAC address to impersonate the default gateway virtual router and intercept subnet traffic.",
    "options": [
      "[1] macguard : Configure virtual switch security policy to REJECT MAC address changes and Forged Transmits",
      "[2] allow    : Allow MAC address spoofing for performance enhancement",
      "[3] dhcp     : Change DHCP server color scheme"
    ],
    "validKeys": [
      "1",
      "macguard",
      "reject",
      "forged",
      "mac"
    ],
    "success": "COUNTERMEASURE DEPLOYED! vSwitch dropped spoofed frames, preventing ARP poisoning and man-in-the-middle attacks.",
    "failure": "BREACH! Rogue VM poisoned the virtual ARP cache, sniffing all credentials traversing the subnet!",
    "hint": "Slide 29: Virtual switches must reject MAC changes and forged transmits to stop spoofing exploits."
  },
  {
    "id": 28,
    "title": "HARDWARE VIRTUALIZATION EXTENSIONS (VT-X / AMD-V)",
    "ref": "SLIDE 21: HARDWARE VMM ENABLERS",
    "threat": "Engineers want to ensure virtual machine execution is enforced by physical CPU silicon boundaries rather than slow software emulation.",
    "options": [
      "[1] vtx     : Enable hardware-assisted virtualization (Intel VT-x / AMD-V with SLAT/EPT) in BIOS/UEFI",
      "[2] python  : Run a Python script in background to emulate CPU registers",
      "[3] disable : Disable virtualization flags in firmware"
    ],
    "validKeys": [
      "1",
      "vtx",
      "vt-x",
      "amd-v",
      "hardware",
      "slat"
    ],
    "success": "COUNTERMEASURE DEPLOYED! CPU silicon virtualization extensions active, enforcing hardware-level boundary isolation.",
    "failure": "BREACH! Software-only binary translation introduced severe latency and privilege boundary vulnerabilities!",
    "hint": "Slide 21: Hardware-assisted virtualization (VT-x/AMD-V) delivers native CPU ring separation and performance."
  },
  {
    "id": 29,
    "title": "LIVE VMOTION MIGRATION MITM INTERCEPTION",
    "ref": "SLIDE 29, 31: VIRTUALIZATION TRAFFIC SECURITY",
    "threat": "Live virtual machine migrations (vMotion) transferring running RAM state between physical hosts across unencrypted corporate LAN.",
    "options": [
      "[1] vmotionsec: Isolate vMotion traffic onto an isolated non-routable VLAN and enable end-to-end vMotion TLS/AES encryption",
      "[2] public    : Send migration packets over public company Wi-Fi",
      "[3] compress  : Compress VM memory with ZIP"
    ],
    "validKeys": [
      "1",
      "vmotionsec",
      "tls",
      "encryption",
      "vlan"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Migration stream encrypted and segregated from standard tenant packet flows.",
    "failure": "BREACH! Cleartext memory contents intercepted in transit, leaking session tokens and decrypted keys!",
    "hint": "Slide 29: Migration traffic transports live volatile RAM and must remain segregated and encrypted."
  },
  {
    "id": 30,
    "title": "MOBILE APP REVERSE ENGINEERING & TAMPERING",
    "ref": "SLIDE 3: MOBILE SECURITY CONTROLS",
    "threat": "Attackers download public APK, inject malicious spyware hooks, re-sign with self-signed certificate, and host on third-party site.",
    "options": [
      "[1] attest : Integrate Play Integrity / App Attestation API and enforce strict digital signature validation",
      "[2] obfusc : Obfuscate code variable names with 1-character names only",
      "[3] ignore : Do nothing because app was already published"
    ],
    "validKeys": [
      "1",
      "attest",
      "signature",
      "play integrity",
      "verification"
    ],
    "success": "COUNTERMEASURE DEPLOYED! App attestation blocked tampered re-packaged binary from connecting to backend APIs.",
    "failure": "BREACH! Modded app distributed to thousands of unsuspecting users, stealing their authentication credentials!",
    "hint": "Slide 3: Mobile platforms require cryptographic code signing verification to guarantee software authenticity."
  },
  {
    "id": 31,
    "title": "CPU CACHE SIDE-CHANNEL (SPECTRE/MELTDOWN) CONTAINMENT",
    "ref": "SLIDES 8, 28: HARDWARE PLATFORM THREATS",
    "threat": "Tenant VM executes speculative execution timing attacks on shared physical CPU L3 cache to read adjacent tenant memory.",
    "options": [
      "[1] microcode: Deploy CPU microcode patches, hypervisor side-channel mitigations, and disable unvetted hyper-threading",
      "[2] overcommit: Double the number of virtual CPUs assigned to each tenant",
      "[3] sleep    : Insert 1-second delay in all JavaScript code"
    ],
    "validKeys": [
      "1",
      "microcode",
      "side-channel",
      "patch",
      "smt"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Hypervisor applied CPU core scheduling isolation and speculative barrier flushes.",
    "failure": "BREACH! Speculative side-channel attack leaked sensitive cryptographic private keys across VM boundaries!",
    "hint": "Slide 8 & 28: Shared hardware resources require CPU microcode updates and strict hypervisor core scheduling."
  },
  {
    "id": 32,
    "title": "IMMUTABLE ROM ROOT OF TRUST ANCHOR",
    "ref": "SLIDE 12: CHAIN OF TRUST GENESIS",
    "threat": "What constitutes the immutable genesis foundation that cannot be modified by any software update in the Chain of Trust?",
    "options": [
      "[1] rom   : Read-Only Memory (ROM) Boot Code etched into physical silicon during processor manufacturing",
      "[2] os    : The Windows Desktop Kernel file (ntoskrnl.exe)",
      "[3] app   : The Microsoft Word application binary"
    ],
    "validKeys": [
      "1",
      "rom",
      "silicon",
      "boot rom",
      "root of trust"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Correctly identified silicon Boot ROM as the immutable anchor verifying the subsequent stages.",
    "failure": "BREACH! Software-defined layers cannot serve as root anchor because they can be subverted by pre-boot rootkits!",
    "hint": "Slide 12: The Root of Trust must start in physical immutable silicon (ROM), where verification begins."
  },
  {
    "id": 33,
    "title": "MANDATORY ACCESS CONTROL (SELINUX / SVIRT) BOUNDARIES",
    "ref": "SLIDE 28: STRONG SEPARATION TECHNIQUES",
    "threat": "A compromised QEMU virtualization process inside the host OS attempts to write to another VM's disk image.",
    "options": [
      "[1] svirt : Enforce sVirt (SELinux-based mandatory access control labeling each VM process with distinct MCS categories)",
      "[2] chmod : Run 'chmod 777' on all virtual machine files",
      "[3] chown : Change owner of all files to root"
    ],
    "validKeys": [
      "1",
      "svirt",
      "selinux",
      "mac",
      "category"
    ],
    "success": "COUNTERMEASURE DEPLOYED! SELinux sVirt policy denied cross-category file access even though process was running.",
    "failure": "BREACH! Without Mandatory Access Control, compromised emulator process manipulated neighboring disk images!",
    "hint": "Slide 28 specifies Strong Separation and access controls (like SELinux/sVirt) to confine VM processes."
  },
  {
    "id": 34,
    "title": "CLOUD METADATA SERVICE SSRF COMPROMISE",
    "ref": "SLIDE 4: CLOUD ARCHITECTURE DEFENSE",
    "threat": "A web app vulnerability allows attackers to query 169.254.169.254 to steal cloud IAM role temporary credentials.",
    "options": [
      "[1] imdsv2 : Mandate IMDSv2 requiring session-oriented token headers and hop-limit restriction of 1",
      "[2] disable : Disable all HTTP networking permanently",
      "[3] ignore  : Assume AWS metadata cannot be queried"
    ],
    "validKeys": [
      "1",
      "imdsv2",
      "token",
      "session",
      "metadata"
    ],
    "success": "COUNTERMEASURE DEPLOYED! IMDSv2 blocked simple SSRF queries, protecting IAM instance profile credentials.",
    "failure": "BREACH! Stolen IAM credentials used to exfiltrate entire corporate S3 data buckets!",
    "hint": "Slide 4: In cloud infrastructure, protecting instance metadata endpoints is vital to preserving IAM boundaries."
  },
  {
    "id": 35,
    "title": "DEFAULT HYPERVISOR CREDENTIALS AUDIT",
    "ref": "SLIDES 27, 31: MISCONFIGURATION HAZARDS",
    "threat": "Newly installed hypervisor server deployed with default vendor credentials 'root / password123' on the management interface.",
    "options": [
      "[1] harden : Mandate unique complex credentials, enforce MFA, and integrate with centralized enterprise PAM/LDAP",
      "[2] leave  : Keep default password so shift workers can remember it easily",
      "[3] sticky : Write root password on server bezel with black marker"
    ],
    "validKeys": [
      "1",
      "harden",
      "mfa",
      "pam",
      "credentials",
      "ldap"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Default password eliminated, MFA enforced, and access logged via centralized PAM.",
    "failure": "BREACH! Automated internet bot scanned port 443, entered default credentials, and seized total hypervisor control!",
    "hint": "Slide 27 highlights default credentials as one of the most common and disastrous virtualization misconfigurations."
  },
  {
    "id": 36,
    "title": "SECURE VM NETWORKING: VIRTUAL FIREWALL PLACEMENT",
    "ref": "SLIDE 29: SECURE VM NETWORKING",
    "threat": "Where must security firewalls be placed to filter East-West traffic moving between VMs located on the same physical host?",
    "options": [
      "[1] vswitch : At the hypervisor virtual switch layer via distributed stateful virtual firewalls",
      "[2] perimeter: Solely at the physical building perimeter gateway firewall 3 hops away",
      "[3] printer  : Inside the office network printer firmware"
    ],
    "validKeys": [
      "1",
      "vswitch",
      "distributed",
      "virtual",
      "hypervisor"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Distributed virtual firewall inspected local packet exchanges before delivery to guest vNICs.",
    "failure": "BREACH! Perimeter physical firewall was completely blind to East-West inter-VM packets staying inside host RAM!",
    "hint": "Slide 29: Physical perimeter firewalls cannot see virtual switch traffic; distributed virtual inspection is required."
  },
  {
    "id": 37,
    "title": "UNAUTHORIZED GUEST MEMORY DUMP PRIVACY BREACH",
    "ref": "SLIDES 4, 31: ADMINISTRATIVE RESPONSIBILITY",
    "threat": "Hypervisor admin wants to debug a performance ticket by taking a full volatile memory dump of a healthcare tenant's patient records.",
    "options": [
      "[1] refuse  : Refuse unauthorized memory inspection; respect multi-tenant confidentiality and adhere to privacy laws",
      "[2] dump    : Take memory dump and search for patient social security numbers",
      "[3] publish : Share memory dump on public technical forum for crowdsourced debugging"
    ],
    "validKeys": [
      "1",
      "refuse",
      "confidentiality",
      "privacy",
      "ethics"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Ethical administration maintained: Zero unauthorized memory scraping of tenant workloads.",
    "failure": "CRITICAL ETHICAL & LEGAL BREACH! Unauthorized hypervisor inspection violated HIPAA and GDPR regulations!",
    "hint": "Slide 31 & 4: Administrative privilege demands strict ethical confidentiality regarding tenant private memory."
  },
  {
    "id": 38,
    "title": "UEFI PLATFORM KEY (PK) AND KEK HIERARCHY",
    "ref": "SLIDE 11: PRE-BOOT ARCHITECTURE",
    "threat": "In the UEFI Secure Boot hierarchy, which cryptographic key represents the ultimate root ownership of the motherboard platform?",
    "options": [
      "[1] pk   : Platform Key (PK) installed by the motherboard manufacturer or OEM owner",
      "[2] wifi : The home Wi-Fi WPA2 pre-shared password",
      "[3] user : The user's Windows PIN code"
    ],
    "validKeys": [
      "1",
      "pk",
      "platform key",
      "oem"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Correctly identified Platform Key (PK) as the apex key governing KEK and db databases.",
    "failure": "BREACH! Misunderstanding UEFI key hierarchy allowed rogue KEK enrollments to subvert Secure Boot!",
    "hint": "Slide 11: The Platform Key (PK) establishes the ownership and trust relationship between the OEM and firmware."
  },
  {
    "id": 39,
    "title": "MOBILE APP SIDELOADING RISK MITIGATION",
    "ref": "SLIDE 3: MOBILE SECURITY MODELS",
    "threat": "Enterprise fleet of Android devices allows employees to enable 'Install from Unknown Sources' and download unverified APKs.",
    "options": [
      "[1] restrict : Enforce MDM policy disabling sideloading and restrict installation to approved enterprise app store",
      "[2] encourage: Instruct users to download cracked APKs from torrent sites",
      "[3] reboot   : Reboot the phone every night"
    ],
    "validKeys": [
      "1",
      "restrict",
      "mdm",
      "sideloading",
      "enterprise"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Sideloading blocked; all enterprise apps verified through managed Google Play with code signing.",
    "failure": "BREACH! Sideloaded malicious Trojan bypassed store vetting and installed commercial spyware on executive phone!",
    "hint": "Slide 3: Controlled distribution channels and digital signatures are fundamental mobile security pillars."
  },
  {
    "id": 40,
    "title": "TPM PHYSICAL TAMPER RESISTANCE BOUNDARY",
    "ref": "SLIDE 10: TPM ARCHITECTURE LIMITATIONS",
    "threat": "A sophisticated threat actor has physical possession of a stolen laptop in a hardware lab with electron microscopes and probe stations.",
    "options": [
      "[1] defense: Combine TPM PIN protection with BitLocker, remote wipe, hardware chassis intrusion detection, and short session timeouts",
      "[2] magic  : Assume TPM is 100% invincible against any physical laboratory attack",
      "[3] tape   : Put masking tape over the USB ports"
    ],
    "validKeys": [
      "1",
      "defense",
      "pin",
      "chassis",
      "timeout",
      "remote wipe"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Multi-layered defense-in-depth mitigated physical bus sniffing and side-channel probing.",
    "failure": "BREACH! Relying solely on TPM without PIN allowed lab attacker to sniff unencrypted bus traffic between TPM and CPU!",
    "hint": "Slide 10 explicitly notes that physical laboratory attacks and bus sniffing remain an inherent TPM limitation."
  },
  {
    "id": 41,
    "title": "LEGACY 16-BIT BIOS MASTER BOOT RECORD LIMITATION",
    "ref": "SLIDE 11: UEFI VS LEGACY BIOS",
    "threat": "Why did modern computing platforms replace traditional legacy BIOS with 32/64-bit UEFI firmware?",
    "options": [
      "[1] uefitrust: Legacy BIOS lacked cryptographic signature checking, operated in 16-bit real mode, and couldn't stop pre-boot MBR rootkits",
      "[2] color    : Because legacy BIOS screens were blue and people preferred black",
      "[3] sound    : Because legacy BIOS couldn't play MP3 files"
    ],
    "validKeys": [
      "1",
      "uefitrust",
      "uefi",
      "mbr",
      "signature",
      "16-bit"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Modern UEFI architecture enforces 64-bit cryptographic verification and Secure Boot.",
    "failure": "BREACH! Legacy BIOS blindly executed whatever code sat in the 512-byte MBR without any authentication!",
    "hint": "Slide 11: Legacy BIOS had no cryptographic trust or verification capabilities, prompting the industry move to UEFI."
  },
  {
    "id": 42,
    "title": "VIRTUAL MACHINE FLOPPY/AUDIO CONTROLLER PRUNING",
    "ref": "SLIDE 26: MINIMAL ATTACK SURFACE",
    "threat": "System administrator creates 100 enterprise server VMs using default wizard templates containing emulated floppy disks and audio cards.",
    "options": [
      "[1] strip   : Audit and remove all unneeded virtual hardware emulation (sound, floppy, unused USB, serial ports)",
      "[2] addmore : Add 4 virtual sound cards to each database VM",
      "[3] ignore  : Leave unused virtual devices attached"
    ],
    "validKeys": [
      "1",
      "strip",
      "prune",
      "remove",
      "hardware"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Unused device emulation stripped, eliminating CVE attack surfaces like VENOM.",
    "failure": "BREACH! Attacker exploited vulnerable legacy floppy emulation code to execute code on the bare-metal host (VENOM attack)!",
    "hint": "Slide 26: Reducing the virtual device attack surface by pruning unused controllers stops VM escape exploits."
  },
  {
    "id": 43,
    "title": "POST-SNAPSHOT ROLLBACK PATCH MANDATE",
    "ref": "SLIDE 30: SNAPSHOT OPERATIONAL BEST PRACTICES",
    "threat": "Disaster recovery incident required rolling back web server to last month's snapshot. What must happen immediately after power-on?",
    "options": [
      "[1] patchnow : Isolate VM, run immediate vulnerability patch cycle, re-apply superseded updates & verify certificates",
      "[2] publish  : Direct production traffic immediately without checking security patches",
      "[3] party    : Declare disaster recovery complete and take the rest of the day off"
    ],
    "validKeys": [
      "1",
      "patchnow",
      "patch",
      "isolate",
      "update"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Re-patch protocol closed vulnerabilities that were revived by the snapshot rollback.",
    "failure": "BREACH! Rollback revived an old unpatched Apache CVE that automated ransomware bots exploited within 20 minutes!",
    "hint": "Slide 30 mandates an immediate vulnerability scan and patch application cycle following any VM rollback."
  },
  {
    "id": 44,
    "title": "MULTI-TENANT NOISY NEIGHBOR MITIGATION",
    "ref": "SLIDE 28: RESOURCE ALLOCATION CONTROLS",
    "threat": "A cryptocurrency mining script running in VM A slows down database query response times for VM B on the same physical host.",
    "options": [
      "[1] clamp : Configure CPU affinity, resource pools with hard caps (MHz limits), and storage IOPS reservations",
      "[2] ask   : Email the owner of VM A asking them politely to stop mining",
      "[3] slow  : Slow down database queries intentionally"
    ],
    "validKeys": [
      "1",
      "clamp",
      "affinity",
      "caps",
      "reservations",
      "iops"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Strict resource quotas and IOPS throttling protected neighboring tenant workloads.",
    "failure": "BREACH! Runaway VM starved neighboring database of CPU cycles, causing widespread application timeouts!",
    "hint": "Slide 28: Resource quotas and reservation controls prevent noisy-neighbor DoS attacks across co-located VMs."
  },
  {
    "id": 45,
    "title": "TPM 2.0 HIERARCHY ARCHITECTURE",
    "ref": "SLIDE 14: TPM 2.0 HIERARCHIES",
    "threat": "Unlike TPM 1.2 which had a single owner, what authorization hierarchies does TPM 2.0 provide for platform security?",
    "options": [
      "[1] hierarchies: Platform Hierarchy (Firmware), Storage Hierarchy (Owner), and Endorsement Hierarchy (Privacy/Certificates)",
      "[2] single     : A single universal master password shared by all users",
      "[3] none       : TPM 2.0 removed authorization altogether"
    ],
    "validKeys": [
      "1",
      "hierarchies",
      "platform",
      "storage",
      "endorsement"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Correctly identified TPM 2.0 primary hierarchies: Platform, Storage, and Endorsement.",
    "failure": "BREACH! Misconfiguring TPM hierarchies compromised separation between OEM firmware trust and user data storage!",
    "hint": "Slide 14 details the distinct Platform, Storage, and Endorsement authorization hierarchies in TPM 2.0."
  },
  {
    "id": 46,
    "title": "CLOUD IAAS VS PAAS SECURITY RESPONSIBILITY",
    "ref": "SLIDE 4: CLOUD PARADIGMS",
    "threat": "Organization is choosing between AWS EC2 (IaaS) and AWS Lambda (PaaS/Serverless). Who manages the underlying OS in Serverless?",
    "options": [
      "[1] provider : The Cloud Provider automatically manages and patches the underlying operating system and runtime",
      "[2] customer : The Customer must log in via SSH and run apt-get update on the serverless host",
      "[3] nobody   : Serverless applications run without any operating system on magic radio waves"
    ],
    "validKeys": [
      "1",
      "provider",
      "cloud provider",
      "aws"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Recognized shift in responsibility: Serverless delegates OS and virtualization patching to provider.",
    "failure": "BREACH! Misallocating administrative resources left EC2 virtual machines unpatched while obsessing over serverless OS!",
    "hint": "Slide 4: As you move from IaaS to PaaS/SaaS, the cloud provider assumes greater operational security responsibility."
  },
  {
    "id": 47,
    "title": "AUDITING HYPERVISOR ACCESS LOGS WITH SIEM",
    "ref": "SLIDE 31: CONTINUOUS MONITORING",
    "threat": "How do platform security engineers detect anomalous administrator logins or suspicious privilege escalation attempts on ESXi/Hyper-V?",
    "options": [
      "[1] siem    : Stream immutable syslog audit trails to an external Security Information and Event Management (SIEM) system",
      "[2] memory  : Rely on administrator memory and verbal status reports",
      "[3] deletelog: Clear system logs every morning to save disk space"
    ],
    "validKeys": [
      "1",
      "siem",
      "syslog",
      "audit",
      "monitoring"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Centralized SIEM detected unauthorized off-hours root login attempt and raised immediate SOC alert.",
    "failure": "BREACH! Attackers wiped local hypervisor log files, erasing all forensic evidence of their intrusion!",
    "hint": "Slide 31 highlights streaming VM and hypervisor telemetry logs to SIEM systems for real-time threat detection."
  },
  {
    "id": 48,
    "title": "DESKTOP VS MOBILE SANDBOX ARCHITECTURE CONTRAST",
    "ref": "SLIDE 3: PLATFORM ARCHITECTURAL COMPARISON",
    "threat": "Why are traditional desktop operating systems (Windows/Linux) historically more vulnerable to malware than mobile operating systems?",
    "options": [
      "[1] openarch : Desktop applications inherit broad user privileges by default and lack mandatory sandboxing between processes",
      "[2] screens  : Because desktop monitors are larger and attract more viruses",
      "[3] mouse    : Because using a computer mouse introduces malware through USB"
    ],
    "validKeys": [
      "1",
      "openarch",
      "desktop",
      "sandbox",
      "privileges"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Correctly analyzed platform architectural contrast between open desktop and sandboxed mobile.",
    "failure": "BREACH! Assuming desktop applications are sandboxed like mobile led to deploying uncontained enterprise software!",
    "hint": "Slide 3 emphasizes that desktop systems prioritize customization and broad access over mobile-style mandatory sandboxing."
  },
  {
    "id": 49,
    "title": "UEFI SECURE BOOT ENROLLMENT OF THIRD-PARTY OS",
    "ref": "SLIDE 11-12: SECURE BOOT CUSTOMIZATION",
    "threat": "Enterprise wants to boot a custom enterprise Linux distribution on Secure Boot hardware without disabling security enforcement.",
    "options": [
      "[1] enroll : Enroll organization's custom public key into UEFI Key Enrollment Key (KEK) and authorized database (db)",
      "[2] disable: Turn off Secure Boot completely and leave hardware unprotected",
      "[3] pirate : Download a pirated Windows bootloader"
    ],
    "validKeys": [
      "1",
      "enroll",
      "kek",
      "db",
      "public key"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Custom enterprise key enrolled securely; Linux kernel verified cryptographically without disabling Secure Boot.",
    "failure": "BREACH! Disabling Secure Boot globally exposed all corporate machines to stealth bootkits!",
    "hint": "Slide 12: Secure Boot allows enrolling custom organization keys into the signature database (db) via the KEK."
  },
  {
    "id": 50,
    "title": "PLATFORM DEFENSE-IN-DEPTH POSTURE CONCLUSION",
    "ref": "SLIDES 2, 5, 31: PLATFORM ARCHITECTURE SYNTHESIS",
    "threat": "What is the single most effective philosophy for protecting enterprise platform architecture across all 4 computing layers?",
    "options": [
      "[1] depth   : Defense-in-Depth: Anchor silicon trust in TPM 2.0, verify UEFI boot, isolate hypervisors, and enforce least privilege",
      "[2] single  : Buy one expensive firewall and assume all other platform layers are automatically safe",
      "[3] hope    : Hope adversaries decide not to target your organization"
    ],
    "validKeys": [
      "1",
      "depth",
      "defense-in-depth",
      "layers",
      "tpm",
      "least privilege"
    ],
    "success": "COUNTERMEASURE DEPLOYED! Mastered Defense-in-Depth across Hardware, Firmware, Operating System, and Applications!",
    "failure": "BREACH! Relying on a single perimeter control allowed adversaries to easily compromise the underlying platform layers!",
    "hint": "Slide 2, 5 & 31: True platform resilience requires multi-layered controls across Hardware, Firmware, OS, and Apps."
  }
];

  const defenderGame = {
    active: false,
    waveIndex: 0,
    integrity: 100,
    score: 0,
    waves: [],

    start() {
      this.active = true;
      this.waveIndex = 0;
      this.integrity = 100;
      this.score = 0;

      // Randomly pick 5 unique questions from the 50-question pool on every game session
      const shuffled = [...QUESTION_BANK].sort(() => 0.5 - Math.random());
      this.waves = shuffled.slice(0, 5).map((q, idx) => ({
        ...q,
        waveNum: idx + 1
      }));

      terminalOutput.innerHTML = `
        <div class="terminal-line game-banner">+========================================================================+</div>
        <div class="terminal-line game-banner">| [!] ALERT: PLATFORM DEFENDER: INCIDENT RESPONSE PROTOCOL INITIALIZED   |</div>
        <div class="terminal-line game-banner">| MISSION: DEFEND 5 RANDOM INCIDENT VECTORS (POOL OF 50 SYLLABUS TOPICS) |</div>
        <div class="terminal-line system-line">| CONTROLS: Type option number ('1', '2', '3'), keyword, 'hint', or 'quit' |</div>
        <div class="terminal-line game-banner">+========================================================================+</div>
      `;

      this.renderCurrentWave();
    },

    getHealthBar() {
      const bars = Math.max(0, Math.round(this.integrity / 10));
      const filled = "█".repeat(bars);
      const empty = "░".repeat(10 - bars);
      return `[${filled}${empty}] ${this.integrity}%`;
    },

    renderCurrentWave() {
      const current = this.waves[this.waveIndex];
      const waveDiv = document.createElement("div");
      waveDiv.innerHTML = `
        <div class="terminal-line game-hud-line">&gt;&gt; WAVE [0${current.waveNum}/05] :: INTEGRITY: ${this.getHealthBar()} | SCORE: ${this.score} PTS</div>
        <div class="terminal-line game-alert-line">THREAT: ${current.title}</div>
        <div class="terminal-line system-line">SOURCE: ${current.ref}</div>
        <div class="terminal-line">&gt; SITUATION: ${current.threat}</div>
        <div class="terminal-line" style="margin-top: 4px; color: var(--color-surface-raised);">COUNTERMEASURE CHOICES:</div>
        ${current.options.map(opt => `<div class="terminal-line game-prompt-choice">${opt}</div>`).join("")}
        <div class="terminal-line system-line">Choose option ('1', '2', '3') or keyword (type 'hint' for course clue, 'quit' to exit):</div>
      `;
      terminalOutput.appendChild(waveDiv);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    },

    handleInput(input) {
      if (input === "quit" || input === "exit") {
        this.active = false;
        const quitDiv = document.createElement("div");
        quitDiv.className = "terminal-line system-line";
        quitDiv.innerText = "> [!] PLATFORM DEFENDER SESSION ABORTED. RETURNED TO AUDITOR CLI SHELL.";
        terminalOutput.appendChild(quitDiv);
        return;
      }

      if (input === "status") {
        const statDiv = document.createElement("div");
        statDiv.className = "terminal-line game-hud-line";
        statDiv.innerText = `> STATUS: WAVE ${this.waveIndex + 1}/5 | INTEGRITY: ${this.getHealthBar()} | SCORE: ${this.score} PTS`;
        terminalOutput.appendChild(statDiv);
        return;
      }

      const current = this.waves[this.waveIndex];

      if (input === "hint" || input === "help") {
        const hintDiv = document.createElement("div");
        hintDiv.className = "terminal-line game-hint-line";
        hintDiv.innerText = `> [?] ADVICE // ${current.hint}`;
        terminalOutput.appendChild(hintDiv);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        return;
      }

      const isMatch = current.validKeys.some(k => input === k || input.includes(k));

      if (isMatch) {
        this.score += 200;
        const successDiv = document.createElement("div");
        successDiv.className = "terminal-line game-success-line";
        successDiv.innerText = `> [+] ${current.success} (+200 PTS)`;
        terminalOutput.appendChild(successDiv);

        this.waveIndex++;
        if (this.waveIndex >= this.waves.length) {
          this.renderVictory();
        } else {
          this.renderCurrentWave();
        }
      } else {
        this.integrity = Math.max(0, this.integrity - 25);
        const failDiv = document.createElement("div");
        failDiv.className = "terminal-line game-alert-line";
        failDiv.innerText = `> [-] ${current.failure} (-25% INTEGRITY)`;
        terminalOutput.appendChild(failDiv);

        if (this.integrity <= 0) {
          this.renderDefeat();
        } else {
          const retryDiv = document.createElement("div");
          retryDiv.className = "terminal-line system-line";
          retryDiv.innerText = `> INTEGRITY AT ${this.integrity}%. Review the choices and try another countermeasure (or type 'hint'):`;
          terminalOutput.appendChild(retryDiv);
        }
      }
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    },

    renderVictory() {
      this.active = false;
      const victDiv = document.createElement("div");
      victDiv.innerHTML = `
        <div class="terminal-line game-success-line">+========================================================================+</div>
        <div class="terminal-line game-success-line">| *** ALL 5 CYBER THREAT WAVES SUCCESSFULLY NEUTRALIZED! ***              |</div>
        <div class="terminal-line game-success-line">+========================================================================+</div>
        <div class="terminal-line game-hud-line">FINAL SCORE : ${this.score} / 1000 PTS | FINAL INTEGRITY: ${this.getHealthBar()}</div>
        <div class="terminal-line system-line">&gt; PLATFORM RANK  : [ S-RANK ] CHIEF PLATFORM DEFENDER</div>
        <div class="terminal-line system-line">&gt; ACCREDITATION  : ITA 216 PLATFORM ARCHITECTURE & VIRTUALIZATION MASTER</div>
        <div class="terminal-line">&gt; All platform layers (Hardware, Firmware, OS, Hypervisor, Cloud) secured!</div>
        <div class="terminal-line game-banner">&gt; Type 'game' to play again, or 'help' to resume standard auditor mode.</div>
      `;
      terminalOutput.appendChild(victDiv);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    },

    renderDefeat() {
      this.active = false;
      const defeatDiv = document.createElement("div");
      defeatDiv.innerHTML = `
        <div class="terminal-line game-alert-line">+========================================================================+</div>
        <div class="terminal-line game-alert-line">| [X] CRITICAL DEFENSE FAILURE: PLATFORM INTEGRITY REACHED 0%            |</div>
        <div class="terminal-line game-alert-line">+========================================================================+</div>
        <div class="terminal-line system-line">&gt; The hypervisor and silicon roots were seized by pre-boot adversaries.</div>
        <div class="terminal-line system-line">&gt; SCORE ACHIEVED: ${this.score} PTS</div>
        <div class="terminal-line game-banner">&gt; Type 'game' to re-initialize defenses, or 'clear' to reset console.</div>
      `;
      terminalOutput.appendChild(defeatDiv);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  };



  if (terminalForm && terminalInput && terminalOutput) {
    terminalForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const rawInput = terminalInput.value.trim().toLowerCase();
      if (!rawInput) return;

      const userLine = document.createElement("div");
      userLine.className = "terminal-line";
      userLine.innerHTML = `<span class="prompt-symbol">auditor@platform-shield:~$</span> ${escapeHTML(rawInput)}`;
      terminalOutput.appendChild(userLine);

      // 1. If Game is currently active, route command to game handler
      if (defenderGame.active) {
        defenderGame.handleInput(rawInput);
        terminalInput.value = "";
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        return;
      }

      // 2. If user requests to start the game
      if (rawInput === "game" || rawInput === "play") {
        defenderGame.start();
        terminalInput.value = "";
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        return;
      }

      // 3. Normal Auditor CLI commands
      if (rawInput === "clear") {
        terminalOutput.innerHTML = `
          <div class="terminal-line system-line">ITA 216 PLATFORM ARCHITECTURE AUDIT CONSOLE V3.5</div>
          <div class="terminal-line system-line">TYPE 'game' TO PLAY PLATFORM DEFENDER, OR 'help' FOR COMMAND LIST.</div>
        `;
      } else {
        const responseLine = document.createElement("div");
        responseLine.className = "terminal-line response-line";
        if (terminalKnowledge[rawInput]) {
          responseLine.innerText = `> ${terminalKnowledge[rawInput]}`;
          if (rawInput === "reboot") {
            setTimeout(runBootSequence, 350);
          }
        } else {
          responseLine.innerText = `> ERR 127: COMMAND '${rawInput}' NOT RECOGNIZED. TYPE 'game' TO PLAY, OR 'help' FOR TOPICS.`;
        }
        terminalOutput.appendChild(responseLine);
      }

      terminalInput.value = "";
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[tag] || tag));
  }

  /* -------------------------------------------------------------------------
     6. MOBILE MENU TOGGLE
     ------------------------------------------------------------------------- */
  const mobileMenuBtn = document.querySelector("#mobileMenuBtn");
  const desktopNavLinks = document.querySelector("#desktopNavLinks");

  if (mobileMenuBtn && desktopNavLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = desktopNavLinks.classList.toggle("open");
      mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenuBtn.textContent = isOpen ? "[CLOSE]" : "[MENU]";
    });

    desktopNavLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        desktopNavLinks.classList.remove("open");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.textContent = "[MENU]";
      });
    });
  }

  /* -------------------------------------------------------------------------
     7. RETRO CRT BIOS BOOT SEQUENCE
     ------------------------------------------------------------------------- */
  const bootScreen = document.querySelector("#crtBootScreen");
  const bootProgressBar = document.querySelector("#bootProgressBar");
  const bootPercentText = document.querySelector("#bootPercentText");
  const btnReboot = document.querySelector("#btnRebootSys");

  function runBootSequence() {
    if (!bootScreen) return;
    bootScreen.classList.remove("fade-out", "hidden");
    document.body.style.overflow = "hidden";
    if (bootProgressBar) bootProgressBar.style.width = "0%";
    if (bootPercentText) bootPercentText.textContent = "LOADING: 0%";

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 14;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(dismissBootScreen, 260);
      }
      if (bootProgressBar) bootProgressBar.style.width = `${progress}%`;
      if (bootPercentText) bootPercentText.textContent = `LOADING: ${progress}%`;
    }, 110);

    function dismissBootScreen() {
      clearInterval(interval);
      bootScreen.classList.add("fade-out");
      document.body.style.overflow = "";
      setTimeout(() => {
        bootScreen.classList.add("hidden");
      }, 380);
      window.removeEventListener("keydown", handleKeySkip);
      bootScreen.removeEventListener("click", handleClickSkip);
    }

    function handleKeySkip(e) {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        dismissBootScreen();
      }
    }

    function handleClickSkip() {
      dismissBootScreen();
    }

    window.addEventListener("keydown", handleKeySkip, { once: true });
    bootScreen.addEventListener("click", handleClickSkip, { once: true });
  }

  // Trigger boot sequence on page load
  runBootSequence();

  if (btnReboot) {
    btnReboot.addEventListener("click", (e) => {
      e.preventDefault();
      runBootSequence();
    });
  }

  /* -------------------------------------------------------------------------
     8. RETRO TYPEWRITER EFFECT FOR HIGHLIGHTED HERO TEXT
     ------------------------------------------------------------------------- */
  const typewriterTarget = document.querySelector("#typewriterTarget");
  const typewriterPhrases = [
    "ARCHITECTURAL DEFENSE GUIDE",
    "SILICON ROOT OF TRUST (TPM)",
    "CHAIN OF TRUST BOOT ENGINE",
    "TYPE-1 HYPERVISOR ISOLATION",
    "VIRTUALIZATION DEFENSE GUIDE"
  ];

  if (typewriterTarget && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let phraseIndex = 0;
    let charIndex = typewriterPhrases[0].length;
    let isDeleting = false;
    let typeDelay = 2600;

    function typeStep() {
      const currentPhrase = typewriterPhrases[phraseIndex];

      if (isDeleting) {
        charIndex--;
        typewriterTarget.textContent = currentPhrase.substring(0, charIndex);
        typeDelay = 40;
      } else {
        charIndex++;
        typewriterTarget.textContent = currentPhrase.substring(0, charIndex);
        typeDelay = 75;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeDelay = 2600;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % typewriterPhrases.length;
        typeDelay = 450;
      }

      setTimeout(typeStep, typeDelay);
    }

    setTimeout(typeStep, typeDelay);
  }
});
