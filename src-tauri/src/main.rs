// Точка входа Windows — делегирует в lib.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    fans_launcher_lib::run();
}
