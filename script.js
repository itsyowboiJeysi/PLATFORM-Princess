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
     4. CATEGORY FILTER RAIL
     ------------------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll(".filter-tag-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;

      projectCards.forEach((card) => {
        if (filter === "all" || card.dataset.category === filter) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  /* -------------------------------------------------------------------------
     5. RETRO PLATFORM SECURITY CLI TERMINAL
     ------------------------------------------------------------------------- */
  const terminalForm = document.querySelector("#terminalForm");
  const terminalInput = document.querySelector("#terminalInput");
  const terminalOutput = document.querySelector("#terminalOutput");

  const terminalKnowledge = {
    help: "SECURITY TOOLKIT COMMAND LIST:\n- 'tpm'        : Hardware Root of Trust & Secure Boot (Slides 8-16)\n- 'uefi'       : Unified Extensible Firmware Interface & Pre-Boot (Slide 11)\n- 'hypervisor' : Type 1 Bare-Metal vs Type 2 Hosted (Slide 21)\n- 'mobile'     : Mobile Sandboxing & Permissions vs Desktop (Slide 3)\n- 'cloud'      : Cloud Infrastructure & Shared Responsibility Model (Slide 4)\n- 'ethics'     : Administrative Ethics & Tenant Confidentiality (Slide 4, 31)\n- 'escape'     : Virtual Machine Escape Mechanics (Slide 26)\n- 'hyperjacking': Blue Pill Hypervisor Takeover (Slide 25)\n- 'snapshots'  : Rollback Vulnerabilities & Mitigation (Slide 30)\n- 'layers'     : 4 Computing Platform Layers & Threat Vectors (Slides 2, 5)\n- 'toolkit'    : Interactive Security Toolkit Suite Overview\n- 'threatlab'  : Virtualization Threat Lab Matrix\n- 'checklist'  : Best Practices for Virtualization Hardening (Slide 31)\n- 'status'     : Live Platform Security Posture Status\n- 'clear'      : Wipe console buffer",
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
    toolkit: "SECURITY TOOLKIT FEATURES:\n1. 'Secure the Platform' Hardening Activity (Slide 31 checklist with live posture meter)\n2. Interactive CLI Terminal Platform Auditor\n3. Retro Modal Topic Deep-Dive Viewer\n4. Category Domain Filter Rail",
    threatlab: "THREAT LAB SIMULATION MATRIX (SLIDES 24-30):\n- Threat #01: Hyperjacking ('Blue Pill' Hypervisor Seizure)\n- Threat #02: VM Escape (Guest-to-Host Boundary Breach)\n- Threat #03: Admin Misconfigurations (Overcommit DoS, Flat VLANs)\n- Threat #04: Snapshot Rollbacks (Stale CVE Reintroduction & RAM Leaks)",
    checklist: "SLIDE 31 BEST PRACTICES:\n1. Keep hypervisor updated & patched\n2. Enforce strict access control & MFA\n3. Use security baselines (CIS, NIST SP 800-125)\n4. Monitor VM behavior with logs & alerts\n5. Encrypt VM images & storage\n6. Segment virtual networking using VLANs\n7. Encrypt and control snapshots\n8. Regularly patch and update after rollback",
    reboot: "REBOOTING PLATFORM_SHIELD SYSTEM ROM (INITIALIZING SILICON ROOT OF TRUST)...",
    status: "STATUS: TPM 2.0 ANCHORED. CHAIN OF TRUST ENFORCED. HYPERVISOR BOUNDARIES VERIFIED. ALL PLATFORM CONTROLS OPERATIONAL."
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

      if (rawInput === "clear") {
        terminalOutput.innerHTML = `
          <div class="terminal-line system-line">ITA 216 PLATFORM ARCHITECTURE AUDIT CONSOLE V3.0</div>
          <div class="terminal-line system-line">TYPE 'help' FOR COMMAND LIST.</div>
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
          responseLine.innerText = `> ERR 127: COMMAND '${rawInput}' NOT RECOGNIZED. TYPE 'help' FOR SECURITY TOPICS.`;
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
});
