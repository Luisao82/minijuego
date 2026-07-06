import UIKit
import Capacitor

// ViewController raíz de la app iOS. Envuelve a CAPBridgeViewController
// como hijo en vez de heredar de él.
//
// Razón: Capacitor 8 marca `prefersHomeIndicatorAutoHidden` (y varias más)
// como `public` en CAPBridgeViewController, y Swift no permite sobreescribir
// propiedades `public` (no `open`) desde otro módulo — daba el error
// "Overriding non-open property outside of its defining module".
//
// Con el patrón wrapper, el override se aplica sobre UIViewController (que
// sí las tiene `open`), y CAPBridgeViewController se añade como child para
// que Capacitor siga funcionando normalmente (WebView, plugins, etc.).
//
// Enganchado desde Base.lproj/Main.storyboard cambiando customClass del
// view controller inicial a MainViewController y customModule a App.

class MainViewController: UIViewController {

  private let bridgeVC = CAPBridgeViewController()

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black

    addChild(bridgeVC)
    bridgeVC.view.frame = view.bounds
    bridgeVC.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(bridgeVC.view)
    bridgeVC.didMove(toParent: self)
  }

  // iOS 11+ pinta una barra blanca en el borde inferior de dispositivos sin
  // botón home (iPhone X en adelante). En un juego a pantalla completa esa
  // barra molesta visualmente. Con `true`, iOS la atenúa tras unos segundos
  // de inactividad — no la oculta del todo (Apple no lo permite en apps
  // interactivas por accesibilidad), pero es lo máximo que se puede pedir.
  override var prefersHomeIndicatorAutoHidden: Bool {
    return true
  }

  // Aplaza el gesto del sistema en el borde inferior: el primer swipe hacia
  // arriba solo despierta la barra, y hace falta un segundo para volver al
  // Home. Evita salir del juego por un swipe accidental durante los botones
  // rojo/azul de equilibrio y mantiene la barra más apagada mientras juegas.
  override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge {
    return .bottom
  }

  // Que el hijo (bridgeVC) no reclame el control de estas propiedades — que
  // las decida MainViewController.
  override var childForHomeIndicatorAutoHidden: UIViewController? {
    return nil
  }

  override var childForScreenEdgesDeferringSystemGestures: UIViewController? {
    return nil
  }
}
