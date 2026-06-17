import io
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import matplotlib.ticker as ticker
import seaborn as sns

sns.set_theme(style="dark", context="talk")

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

    bg_blue = "#0052FF"
    crown_yellow = "#FFD700"
    text_white = "#FFFFFF"

    fig.patch.set_facecolor(bg_blue)
    ax.set_facecolor(bg_blue)

    ax.tick_params(colors=text_white, labelsize=14)
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)
    ax.set_xlabel(x_label, color=text_white, fontweight='bold', labelpad=10)
    ax.set_ylabel(y_label, color=text_white, fontweight='bold', labelpad=10)
    ax.set_title(title, color=text_white, fontsize=18, fontweight='bold', pad=15)

    for spine in ax.spines.values():
        spine.set_color(text_white)
        spine.set_visible(True)

    def integer_tick_formatter(x, pos):
        if x < 0 or x != int(x):
            return ''
        return str(int(x))

    fmt = ticker.FuncFormatter(integer_tick_formatter)
    ax.xaxis.set_major_formatter(fmt)
    ax.yaxis.set_major_formatter(fmt)
    ax.xaxis.set_major_locator(ticker.MultipleLocator(1))
    ax.yaxis.set_major_locator(ticker.MultipleLocator(1))

    unique_pts, counts = np.unique(coordinates_arr, axis=0, return_counts=True)
    gridsize = max(50, min(int(resolution), 400))

    cmap = mcolors.LinearSegmentedColormap.from_list(
        "score_rush_gradient",
        ["#007BFF", "#41A0FF", "#94C7FF", "#E6C600", crown_yellow],
        N=256
    )

    sns.kdeplot(
        x=unique_pts[:, 0],
        y=unique_pts[:, 1],
        weights=counts.astype(float),
        fill=True,
        cmap=cmap,
        thresh=0.05,
        levels=15,
        cut=3,
        clip=((x_min, x_max), (y_min, y_max)),
        bw_adjust=0.8,
        gridsize=gridsize,
        ax=ax,
    )

    plt.tight_layout()

    if return_bytes:
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, facecolor=fig.get_facecolor(), edgecolor='none')
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()
    else:
        plt.show()