import io
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(
    style="white",
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


    coordinates_arr = np.array(coordinates, dtype=float)

    margin = 1
    x_min, x_max = coordinates_arr[:, 0].min() - margin, coordinates_arr[:, 0].max() + margin
    y_min, y_max = coordinates_arr[:, 1].min() - margin, coordinates_arr[:, 1].max() + margin


    fig, ax = plt.subplots(figsize=(12, 8))

    ax.tick_params(colors="#000000", labelsize=14)
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)
    ax.set_xlabel(x_label, color="#000000")
    ax.set_ylabel(y_label, color="#000000")

    unique_pts, counts = np.unique(coordinates_arr, axis=0, return_counts=True)
    gridsize = max(50, min(int(resolution), 400))
    cmap = sns.cubehelix_palette(start=0.5, light=1, as_cmap=True)

    sns.kdeplot(
        x=unique_pts[:, 0],
        y=unique_pts[:, 1],
        weights=counts.astype(float),
        fill=True,
        cmap=cmap,
        thresh=0,
        levels=15,
        cut=3,
        clip=((x_min, x_max), (y_min, y_max)),
        bw_adjust=0.8,
        gridsize=gridsize,
        ax=ax,
    )

    ax.set_title(title, color="#000000")

    sns.despine(ax=ax)

    plt.tight_layout()

    if return_bytes:
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()
    else:
        plt.show()
