from matplotlib.ticker import MaxNLocator
import io
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.colors import Normalize
from scipy.interpolate import RBFInterpolator

sns.set_theme(
    style="whitegrid",
    context="talk",     
    palette="deep"
)

def diagrama_predicciones(
    coordinates,
    resolution,
    title,
    x_label,
    y_label,
    return_bytes=False
):
    if not coordinates:
        raise ValueError("coordinates cannot be empty")


    coordinates_arr = np.array(coordinates)

    margin = 1
    x_min, x_max = coordinates_arr[:, 0].min() - margin, coordinates_arr[:, 0].max() + margin
    y_min, y_max = coordinates_arr[:, 1].min() - margin, coordinates_arr[:, 1].max() + margin


    unique_pts, counts = np.unique(coordinates_arr, axis=0, return_counts=True)

    rbf = RBFInterpolator(
        unique_pts,
        counts.astype(float),
        kernel="thin_plate_spline",  
        smoothing=0.5,              
    )

    xi = np.linspace(x_min, x_max, resolution)
    yi = np.linspace(y_min, y_max, resolution)
    XX, YY = np.meshgrid(xi, yi)
    Z = np.clip(rbf(np.column_stack([XX.ravel(), YY.ravel()])).reshape(XX.shape), 0, None)


    fig, ax = plt.subplots(figsize=(12, 8))

    ax.tick_params(colors="#000000", labelsize=14)
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)
    ax.set_xlabel(x_label, color="#000000")
    ax.set_ylabel(y_label, color="#000000")

    im = ax.imshow(Z, origin="lower",
                        extent=[x_min, x_max, y_min, y_max],
                        cmap="magma", aspect="auto", interpolation="bilinear")
                        
    fig.colorbar(im, ax=ax, pad=0.02).ax.tick_params()
    ax.yaxis.set_major_locator(MaxNLocator(integer=True))
    ax.set_title(title, color="#000000")

    sns.despine()

    plt.tight_layout()

    if return_bytes:
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()
    else:
        plt.show()