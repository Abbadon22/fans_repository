interface ConnectionHelpProps {
  host: string;
  port: number;
}

/** Подсказки при ECONNREFUSED. */
export function ConnectionHelp({ host, port }: ConnectionHelpProps) {
  return (
    <div className="alert error">
      <p>
        <strong>Нет связи с Web Dashboard</strong> ({host}:{port})
      </p>
      <ul className="help-list">
        <li>Сервер 7DTD должен быть <strong>запущен</strong> (порт открывается только вместе с сервером).</li>
        <li>Проверьте в браузере: <code>http://{host}:{port}</code></li>
        <li>После смены <code>.env</code> перезапустите: <code>npm run dev</code></li>
        <li>В WorldHosts: порт TCP {port} проброшен на Web Dashboard.</li>
      </ul>
    </div>
  );
}
