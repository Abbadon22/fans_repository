use std::sync::atomic::{AtomicBool, Ordering};

/// Управление загрузкой модов: пауза, возобновление, отмена.
#[derive(Default)]
pub struct DownloadControl {
    cancelled: AtomicBool,
    paused: AtomicBool,
}

pub const DOWNLOAD_CANCELLED_MSG: &str = "Загрузка отменена";

impl DownloadControl {
    pub fn reset(&self) {
        self.cancelled.store(false, Ordering::SeqCst);
        self.paused.store(false, Ordering::SeqCst);
    }

    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
        self.paused.store(false, Ordering::SeqCst);
    }

    pub fn pause(&self) {
        self.paused.store(true, Ordering::SeqCst);
    }

    pub fn resume(&self) {
        self.paused.store(false, Ordering::SeqCst);
    }

    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    pub fn is_paused(&self) -> bool {
        self.paused.load(Ordering::SeqCst)
    }

    pub async fn wait_until_running(&self) -> Result<(), String> {
        while self.is_paused() {
            if self.is_cancelled() {
                return Err(DOWNLOAD_CANCELLED_MSG.to_string());
            }
            tokio::time::sleep(std::time::Duration::from_millis(120)).await;
        }
        if self.is_cancelled() {
            return Err(DOWNLOAD_CANCELLED_MSG.to_string());
        }
        Ok(())
    }
}
