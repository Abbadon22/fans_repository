//! Утилиты для работы с процессами без всплывающей консоли (Windows).

#[cfg(target_os = "windows")]
pub mod platform {
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    /// Флаг CREATE_NO_WINDOW — дочерний процесс без окна консоли.
    pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    pub fn command_no_window(program: &str) -> Command {
        let mut cmd = Command::new(program);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd
    }
}

/// Запущен ли 7DaysToDie.exe (без tasklist / cmd).
pub fn is_7dtd_running() -> bool {
    let mut sys = sysinfo::System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .any(|p| p.name().eq_ignore_ascii_case("7DaysToDie.exe"))
}
